/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'شماره موبایل ارسال نشده.' },
        { status: 400 }
      );
    }

    // پیدا کردن کاربر
    const user = await prismadb.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'کاربر پیدا نشد.' },
        { status: 404 }
      );
    }

    // ساخت JWT
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ست کردن کوکی
    cookies().set({
      name: 'auth_token',
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json(
      { success: true, message: 'ورود موفقیت‌آمیز' },
      { status: 200 }
    );
  } catch (err) {
    console.error('LOGIN OTP ERROR:', err);
    return NextResponse.json(
      { success: false, error: 'خطا در ورود کاربر' },
      { status: 500 }
    );
  }
}
