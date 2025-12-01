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
// 3) مسیرهای ممنوع برای مهمان‌ها
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
// -------------------------------
async function handleLessonMediaAccess(request, user) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/courses/') || !pathname.includes('/lesson/')) {
    return null;
  }

  const shortAddress = pathname.split('/')[2];
  const sessionId = pathname.split('/')[4];

  try {
    // سطح دسترسی رسانه
    const mediaResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-media-access?sessionId=${sessionId}`
    );

    if (mediaResponse.status !== 200) {
      return NextResponse.redirect(
        new URL(`/courses/${shortAddress}`, request.url)
      );
    }

    const media = await mediaResponse.json();

    if (media.accessLevel === PUBLIC) return null;

    if (media.accessLevel === REGISTERED && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (media.accessLevel === PURCHASED) {
      if (!user) return NextResponse.redirect(new URL('/login', request.url));

      const purchaseResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-purchase?userId=${user.userId}&shortAddress=${shortAddress}`
      );

      if (purchaseResponse.status !== 200) {
        return NextResponse.redirect(
          new URL(`/courses/${shortAddress}`, request.url)
        );
      }
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
