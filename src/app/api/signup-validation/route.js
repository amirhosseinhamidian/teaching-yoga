import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber';

export async function POST(req) {
  try {
    const { username, phone } = await req.json();

    // 1) Validate phone
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errorMessage },
        { status: 400 }
      );
    }

    // 2) Check username uniqueness
    const usernameExists = await prismadb.user.findUnique({
      where: { username },
    });

    if (usernameExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'این نام کاربری قبلاً استفاده شده است.',
        },
        { status: 409 }
      );
    }

    // 3) Check phone uniqueness
    const phoneExists = await prismadb.user.findUnique({
      where: { phone },
    });

    if (phoneExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'این شماره موبایل قبلاً استفاده شده است.',
        },
        { status: 409 }
      );
    }

    // 4) If everything is OK
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signup validation error:', error);
    return NextResponse.json(
      { success: false, error: 'مشکل در پردازش درخواست.' },
      { status: 500 }
    );
  }
}
