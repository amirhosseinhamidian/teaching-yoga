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

const isAdminOrManager = (user) =>
  !!user?.userId && (user.role === 'ADMIN' || user.role === 'MANAGER');

// -------------------------------
// 1) مسیرهای ادمین
// -------------------------------
async function handleAdminRoutes(request, user) {
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith('/a-panel');

  if (isAdminRoute && !isAdminOrManager(user)) {
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
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || `${request.nextUrl.origin}`;

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

      if (purchaseResponse.status === 200 && data?.hasAccess) {
        return null;
      }

      if (purchaseResponse.status === 403) {
        return NextResponse.redirect(
          new URL(`/courses/${shortAddress}`, request.url)
        );
      }

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
// 5) چک وضعیت نمایش فروشگاه (shopVisibility)
// OFF | ADMIN_ONLY | ALL
//
// ✅ اینبار می‌تونیم از API داخلی فچ کنیم چون matcher شامل /api نیست.
// -------------------------------
async function handleShopRoutes(request, user) {
  const path = request.nextUrl.pathname;

  const isShopUI = path === '/shop' || path.startsWith('/shop/');
  if (!isShopUI) return null;

  // فایل‌های سیستمی
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/favicon')
  ) {
    return null;
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || `${request.nextUrl.origin}`;

    // پیشنهاد: یک API خیلی سبک داشته باش:
    // GET /api/shop/status -> { shopVisibility: "ALL" | "ADMIN_ONLY" | "OFF" }
    const res = await fetch(`${baseUrl}/api/shop/status`, {
      cache: 'no-store',
      headers: {
        // این هدر کمک می‌کنه اگر خواستی داخل API تشخیص بدی درخواست از middleware اومده
        'x-from-middleware': '1',
      },
    });

    const json = await res.json().catch(() => ({}));
    const shopVisibility = String(json?.shopVisibility || 'ALL').toUpperCase();

    // OFF → هیچکس
    if (shopVisibility === 'OFF') {
      // می‌تونی به جای access-denied، به صفحه اصلی ببری
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    // ADMIN_ONLY → فقط ADMIN/MANAGER
    if (shopVisibility === 'ADMIN_ONLY' && !isAdminOrManager(user)) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    // ALL → همه مجاز
    return null;
  } catch (e) {
    console.error('shop visibility check failed in middleware:', e);
    // اگر به هر دلیلی API خطا داد، امن‌ترین حالت اینه که فروشگاه رو نبینن
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }
}

// -------------------------------
// Middleware اصلی
// -------------------------------
export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // ✅ اگر بعداً matcher رو گسترش دادی، این گارد جلوی لوپ رو می‌گیره
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const user = await getUserFromJWT(request);

  const handlers = [
    handleShopRoutes,
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
  matcher: [
    '/profile',
    '/a-panel/:path*',
    '/payment',
    '/courses/:path*',
    '/shop/:path*',
    '/shop',
  ],
};
