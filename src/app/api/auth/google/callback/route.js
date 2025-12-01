/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=google_no_code', req.url)
    );
  }

  try {
    // 1) دریافت توکن
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(
        new URL('/login?error=google_token_failed', req.url)
      );
    }

    // 2) اطلاعات کاربر
    const userInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(
        new URL('/login?error=google_no_email', req.url)
      );
    }

    // 3) پیدا کردن کاربر
    let user = await prismadb.user.findUnique({
      where: { email: googleUser.email },
    });

    // 4) ساخت کاربر جدید
    if (!user) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const generatedUsername =
        (googleUser.given_name || 'user') + '_' + randomDigits;

      user = await prismadb.user.create({
        data: {
          email: googleUser.email,
          username: generatedUsername,
          firstname: googleUser.given_name || '',
          lastname: googleUser.family_name || '',
          avatar: googleUser.picture || null,
          phone: null,
          role: 'USER',
        },
      });
    }

    // 5) JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6) کوکی
    cookies().set('auth_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    // 7) ریدایرکت موفقیت
    return NextResponse.redirect(new URL('/', req.url));
  } catch (error) {
    console.log('Google Login Error:', error);
    return NextResponse.redirect(
      new URL('/login?error=google_failed', req.url)
    );
  }
}
