import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // حذف کوکی
    cookies().set({
      name: 'auth_token',
      value: '',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json(
      { success: true, message: 'خروج موفقیت‌آمیز.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در خروج از حساب.' },
      { status: 500 }
    );
  }
}
