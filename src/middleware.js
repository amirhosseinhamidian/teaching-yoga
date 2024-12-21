/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PUBLIC, PURCHASED, REGISTERED } from './constants/videoAccessLevel';

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const adminRoutes = ['/a-panel', '/a-panel/:path*'];

  // بررسی دسترسی به مسیرهای ادمین
  const isAdminRoute = adminRoutes.some((route) =>
    new RegExp(route.replace(/\/:path\*/g, '(\\/.*)?')).test(
      request.nextUrl.pathname,
    ),
  );

  if (isAdminRoute) {
    if (!token || token.userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }
  }

  // مسیرهای دسترسی غیر مجاز برای کاربری که وارد حساب کاربری نشده است
  const accessDeniedRoutes = ['/payment'];
  const isAccessDeniedRoutes = accessDeniedRoutes.some((route) =>
    new RegExp(route).test(request.nextUrl.pathname),
  );
  if (isAccessDeniedRoutes && !token) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  // مسیرهای محافظت‌شده (Protected Routes)
  const protectedRoutes = ['/profile', '/courses/:path*/lesson/:path*'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    new RegExp(route).test(request.nextUrl.pathname),
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (
    request.nextUrl.pathname.startsWith('/courses/') &&
    request.nextUrl.pathname.includes('/lesson/')
  ) {
    const pathnameParts = request.nextUrl.pathname.split('/');
    const shortAddress = pathnameParts[2];
    const sessionId = pathnameParts[4];

    try {
      const videoResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-video-access?sessionId=${sessionId}`,
      );

      if (videoResponse.status !== 200) {
        return NextResponse.redirect(
          new URL(`/courses/${shortAddress}`, request.url),
        );
      }

      const sessionVideo = await videoResponse.json();

      if (sessionVideo.accessLevel === PUBLIC) {
        return NextResponse.next();
      }

      if (sessionVideo.accessLevel === REGISTERED) {
        if (!token) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
      }

      if (sessionVideo.accessLevel === PURCHASED) {
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
      console.error('Error checking purchase:', error);
      return NextResponse.redirect(new URL('/error', request.url));
    }
  }

  return NextResponse.next();
}

// تنظیم matcher برای مسیرهای خاص
export const config = {
  matcher: ['/profile', '/courses/:path*', '/a-panel/:path*', '/payment'],
};
