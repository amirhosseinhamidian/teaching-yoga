/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { PUBLIC, PURCHASED, REGISTERED } from './constants/videoAccessLevel';

export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // مسیرهای محافظت‌شده (Protected Routes)
  const protectedRoutes = ['/profile', '/courses/:path*/lesson/:path*'];

  // بررسی اگر مسیر محافظت‌شده است و کاربر وارد نشده است
  const isProtectedRoute = protectedRoutes.some((route) =>
    new RegExp(route).test(request.nextUrl.pathname),
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // بررسی مسیرهای مربوط به جلسات دوره
  if (
    request.nextUrl.pathname.startsWith('/courses/') &&
    request.nextUrl.pathname.includes('/lesson/')
  ) {
    const pathnameParts = request.nextUrl.pathname.split('/');
    const shortAddress = pathnameParts[2];
    const sessionId = pathnameParts[4];
    console.log('sessionId in middleware => ', sessionId);

    try {
      // فراخوانی API برای دریافت اطلاعات دسترسی
      const videoResponse = await fetch(
        `http://localhost:3000/api/check-video-access?sessionId=${sessionId}`,
      );

      if (videoResponse.status !== 200) {
        return NextResponse.redirect(
          new URL(`/courses/${shortAddress}`, request.url),
        ); // هدایت به صفحه اصلی اگر ویدیو پیدا نشد
      }

      const sessionVideo = await videoResponse.json();

      // دسترسی عمومی
      if (sessionVideo.accessLevel === PUBLIC) {
        return NextResponse.next();
      }

      // دسترسی برای کاربران وارد شده
      if (sessionVideo.accessLevel === REGISTERED) {
        if (!token) {
          return NextResponse.redirect(new URL('/login', request.url)); // هدایت به صفحه ورود
        }
        return NextResponse.next();
      }

      if (sessionVideo.accessLevel === PURCHASED) {
        if (!token) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
        // ارسال درخواست به API برای بررسی خرید دوره
        const purchaseResponse = await fetch(
          `http://localhost:3000/api/check-purchase?userId=${token.userId}&shortAddress=${shortAddress}`,
        );

        if (purchaseResponse.status !== 200) {
          return NextResponse.redirect(
            new URL(`/courses/${shortAddress}`, request.url),
          );
        }
      }
    } catch (error) {
      console.error('Error checking purchase:', error);
      return NextResponse.redirect(new URL('/error', request.url)); // هدایت به صفحه خطا در صورت وقوع مشکل
    }
  }

  return NextResponse.next();
}

// تنظیم matcher برای مسیرهای خاص
export const config = {
  matcher: ['/profile', '/courses/:path*'],
};
