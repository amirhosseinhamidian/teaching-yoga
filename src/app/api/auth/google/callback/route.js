/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const APP_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const redirectTo = (path) => {
  return NextResponse.redirect(new URL(path, APP_BASE_URL));
};

export async function GET(req) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return redirectTo('/login?error=google_no_code');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
      console.error('Google token error:', tokenData);
      return redirectTo('/login?error=google_token_failed');
    }

    const userInfoRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      return redirectTo('/login?error=google_no_email');
    }

    let user = await prismadb.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);

      user = await prismadb.user.create({
        data: {
          email: googleUser.email,
          username: `${googleUser.given_name || 'user'}_${randomDigits}`,
          firstname: googleUser.given_name || '',
          lastname: googleUser.family_name || '',
          avatar: googleUser.picture || null,
          phone: null,
          role: 'USER',
        },
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = redirectTo('/');

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Google Login Error:', error);
    return redirectTo('/login?error=google_failed');
  }
}
