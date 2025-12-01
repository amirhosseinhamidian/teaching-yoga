import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber';

export async function POST(req) {
  try {
    const { username, phone } = await req.json();

    // Validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.errorMessage },
        { status: 400 }
      );
    }

    // Check username unique
    const usernameExists = await prismadb.user.findUnique({
      where: { username },
    });

    if (usernameExists) {
      return NextResponse.json(
        { success: false, error: 'این نام کاربری قبلاً استفاده شده است.' },
        { status: 409 }
      );
    }

    // Check phone unique
    const phoneExists = await prismadb.user.findUnique({
      where: { phone },
    });

    if (phoneExists) {
      return NextResponse.json(
        { success: false, error: 'این شماره موبایل قبلاً ثبت شده است.' },
        { status: 409 }
      );
    }

    // Create user
    const newUser = await prismadb.user.create({
      data: {
        username,
        phone,
        role: 'USER',
      },
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ساخت حساب کاربری.' },
      { status: 500 }
    );
  }
}
