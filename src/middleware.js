/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PUBLIC, PURCHASED, REGISTERED } from './constants/videoAccessLevel';

const JWT_SECRET = process.env.JWT_SECRET;

// -------------------------------
// خواندن و validate کردن JWT از cookie
// -------------------------------
async function getUserFromJWT(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.id,
      phone: payload.phone,
      role: payload.role || 'USER',
    };
  } catch (err) {
    console.error('JWT ERROR in middleware:', err);
    return null;
  }
}

function getBaseUrl(request) {
  // 1) اگر خودت تو env ست کردی (پیشنهادی)
  const envUrl =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.LIARA_URL
      ? `https://${process.env.LIARA_URL.replace(/^https?:\/\//, '')}`
      : null);

  if (envUrl) return envUrl;

  // 2) fallback: از هدرهای پروکسی بخون
  const proto = (request.headers.get('x-forwarded-proto') || 'https')
    .split(',')[0]
    .trim();
  let host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  )
    .split(',')[0]
    .trim();

  // اگر اشتباهاً پورت داخلی چسبیده بود، برای https حذفش کن
  if (proto === 'https') host = host.replace(/:3000$/, '');

  return `${proto}://${host}`;
}

// -------------------------------
// 1) مسیرهای ادمین
// -------------------------------
async function handleAdminRoutes(request, user) {
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/a-panel');

  if (isAdminRoute && (!user || user.role !== 'ADMIN')) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return null;
}

// -------------------------------
// 2) مسیرهایی که نیازمند لاگین هستند
// -------------------------------
async function handleProtectedRoutes(request, user) {
  const protectedRoutes = ['/profile'];
  const path = request.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return null;
}

// -------------------------------
// 3) مسیرهایی که مهمان نباید ببیند (مثل payment)
// -------------------------------
async function handleAccessDeniedRoutes(request, user) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/payment') && !user) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return null;
}

// -------------------------------
// 4) بررسی مجوز دسترسی به ویدیوهای درس
//    (خرید دوره + اشتراک)
// -------------------------------
async function handleLessonMediaAccess(request, user) {
  const { pathname } = request.nextUrl;

  // فقط برای مسیرهای /courses/[shortAddress]/lesson/[sessionId]
  if (!pathname.startsWith('/courses/') || !pathname.includes('/lesson/')) {
    return null;
  }

  const shortAddress = pathname.split('/')[2];
  const sessionId = pathname.split('/')[4];

  try {
    // ✅ بهتره بجای NEXT_PUBLIC_API_BASE_URL از origin همین درخواست استفاده کنیم
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    // ۱) سطح دسترسی رسانه را می‌گیریم
    const mediaResponse = await fetch(
      `${baseUrl}/api/check-media-access?sessionId=${sessionId}`,
      { cache: 'no-store' }
    );

    if (mediaResponse.status !== 200) {
      return NextResponse.redirect(
        new URL(`/courses/${shortAddress}`, request.url)
      );
    }

    const media = await mediaResponse.json();

    // جلسه عمومی → دسترسی برای همه
    if (media.accessLevel === PUBLIC) return null;

    // فقط کاربران ثبت‌نام کرده
    if (media.accessLevel === REGISTERED && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // جلسات فقط برای خریداران/مشترکین
    if (media.accessLevel === PURCHASED) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // ۲) چک دسترسی بر اساس خرید دوره یا اشتراک
      const purchaseResponse = await fetch(
        `${baseUrl}/api/check-purchase?userId=${user.userId}&shortAddress=${shortAddress}`,
        { cache: 'no-store' }
      );

      const data = await purchaseResponse.json().catch(() => null);

      // ✅ خروجی جدید: hasAccess
      if (purchaseResponse.status === 200 && data?.hasAccess) {
        return null; // اجازه ورود به صفحه lesson
      }

      // اگر دسترسی ندارد → برگرد به صفحه دوره
      if (purchaseResponse.status === 403) {
        // چون گفتی inSubscription رو حذف کنیم، دیگه ریدایرکت به /subscriptions نداریم
        return NextResponse.redirect(
          new URL(`/courses/${shortAddress}`, request.url)
        );
      }

      // خطاهای سرور
      if (purchaseResponse.status >= 500) {
        return NextResponse.redirect(new URL('/error', request.url));
      }

      return NextResponse.redirect(
        new URL(`/courses/${shortAddress}`, request.url)
      );
    }
  } catch (err) {
    console.error('media access error:', err);
    return NextResponse.redirect(new URL('/error', request.url));
  }

  return null;
}

// -------------------------------
// Middleware اصلی
// -------------------------------
export async function middleware(request) {
  const user = await getUserFromJWT(request);

  const handlers = [
    handleAdminRoutes,
    handleProtectedRoutes,
    handleAccessDeniedRoutes,
    handleLessonMediaAccess,
  ];

  for (const handler of handlers) {
    const result = await handler(request, user);
    if (result) return result;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile', '/a-panel/:path*', '/payment', '/courses/:path*'],
};
