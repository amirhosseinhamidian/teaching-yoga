import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PUT(request, { params }) {
  try {
    // دریافت id از URL
    const { id } = params;

    // چک کردن اینکه id وارد شده است یا نه
    if (!id) {
      return NextResponse.json(
        { error: 'شناسه کاربر مشخص نشده است' },
        { status: 400 },
      );
    }

    // دریافت داده‌های جدید کاربر از بدنه درخواست
    const { firstname, lastname, username, email } = await request.json();

    // چک کردن اینکه داده‌ها کامل هستند یا نه
    if (!username) {
      return NextResponse.json(
        { error: 'نام کاربری باید تکمیل شود' },
        { status: 400 },
      );
    }

    // پیدا کردن کاربر براساس id
    const user = await prismadb.user.findUnique({
      where: { id: id }, // تبدیل id به عدد اگر رشته باشد
    });

    // اگر کاربر پیدا نشد
    if (!user) {
      return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
    }

    // به‌روزرسانی اطلاعات کاربر
    const updatedUser = await prismadb.user.update({
      where: { id: id },
      data: {
        firstname,
        lastname,
        username,
        ...(email && email.trim() !== '' && { email }),
      },
    });

    // در صورت موفقیت
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    let errorResponse = { error: 'خطای داخلی سرور', field: null };
    if (
      error.meta &&
      error.meta.target &&
      error.meta.target[0] === 'username'
    ) {
      errorResponse = {
        error: 'این نام کاربری قبلا ثبت شده است',
        field: 'username',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
