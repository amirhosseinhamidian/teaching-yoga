/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PUBLIC, PURCHASED, REGISTERED } from './constants/videoAccessLevel';

// بررسی دسترسی ادمین
async function handleAdminRoutes(request, token) {
  const adminRoutes = ['/a-panel', '/a-panel/:path*'];
  const isAdminRoute = adminRoutes.some((route) =>
    new RegExp(route.replace(/\/:path\*/g, '(\\/.*)?')).test(
      request.nextUrl.pathname,
    ),
  );

  if (isAdminRoute && (!token || token.userRole !== 'ADMIN')) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return null;
}

// بررسی دسترسی کاربران غیر لاگین شده
async function handleAccessDeniedRoutes(request, token) {
  const accessDeniedRoutes = ['/payment'];
  const isAccessDeniedRoute = accessDeniedRoutes.some((route) =>
    new RegExp(route).test(request.nextUrl.pathname),
  );

  if (isAccessDeniedRoute && !token) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return null;
}

// بررسی مسیرهای محافظت‌شده
async function handleProtectedRoutes(request, token) {
  const protectedRoutes = ['/profile', '/courses/:path*/lesson/:path*'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    new RegExp(route).test(request.nextUrl.pathname),
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return null;
}

async function handleLessonMediaAccess(request, token) {
  if (
    request.nextUrl.pathname.startsWith('/courses/') &&
    request.nextUrl.pathname.includes('/lesson/')
  ) {
    const pathnameParts = request.nextUrl.pathname.split('/');
    const shortAddress = pathnameParts[2];
    const sessionId = pathnameParts[4];

    try {
      const mediaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-media-access?sessionId=${sessionId}`,
      );

      if (mediaResponse.status !== 200) {
        return NextResponse.redirect(
          new URL(`/courses/${shortAddress}`, request.url),
        );
      }

      const media = await mediaResponse.json();

      if (media.accessLevel === PUBLIC) {
        return null; // دسترسی عمومی
      }

      if (media.accessLevel === REGISTERED && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (media.accessLevel === PURCHASED) {
        if (!token) {
          return NextResponse.redirect(new URL('/login', request.url));
        }

        const purchaseResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-purchase?userId=${token.userId}&shortAddress=${shortAddress}`,
        );

        if (purchaseResponse.status !== 200) {
          return NextResponse.redirect(
            new URL(`/courses/${shortAddress}`, request.url),
          );
        }
      }
    } catch (error) {
      console.error('Error checking media access:', error);
      return NextResponse.redirect(new URL('/error', request.url));
    }
  }

  return null;
}

// Middleware اصلی
export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // پردازش منطق‌ها
  const handlers = [
    handleAdminRoutes,
    handleAccessDeniedRoutes,
    handleProtectedRoutes,
    handleLessonMediaAccess,
  ];

  for (const handler of handlers) {
    const result = await handler(request, token);
    if (result) return result;
  }

  return NextResponse.next();
}

// تنظیم matcher برای مسیرهای خاص
export const config = {
  matcher: ['/profile', '/courses/:path*', '/a-panel/:path*', '/payment'],
};
