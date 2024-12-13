import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function DELETE(request, { params }) {
  try {
    // دریافت نام کاربری از URL
    const { username } = params;

    // چک کردن اینکه یوزرنیم وارد شده است یا نه
    if (!username) {
      return NextResponse.json(
        { error: 'یوزرنیم مشخص نشده است' },
        { status: 400 },
      );
    }

    // پیدا کردن کاربر براساس یوزرنیم
    const user = await prismadb.user.delete({
      where: { username: username },
    });

    // اگر کاربر پیدا نشد
    if (!user) {
      return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
    }

    // در صورت موفقیت
    return NextResponse.json(
      { message: `کاربر ${username} با موفقیت حذف شد` },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    // دریافت نام کاربری از URL
    const { username } = params;

    // چک کردن اینکه یوزرنیم وارد شده است یا نه
    if (!username) {
      return NextResponse.json(
        { error: 'یوزرنیم مشخص نشده است' },
        { status: 400 },
      );
    }

    // دریافت داده‌های جدید کاربر از بدنه درخواست
    const { phoneNumber, firstname, lastname, role, newUsername } =
      await request.json();

    // چک کردن اینکه داده‌ها کامل هستند یا نه
    if (!phoneNumber || !newUsername || !role) {
      return NextResponse.json(
        { error: 'تمام فیلدها باید تکمیل شوند' },
        { status: 400 },
      );
    }

    // پیدا کردن کاربر براساس یوزرنیم
    const user = await prismadb.user.findUnique({
      where: { username: username },
    });

    // اگر کاربر پیدا نشد
    if (!user) {
      return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
    }

    // به‌روزرسانی اطلاعات کاربر
    const updatedUser = await prismadb.user.update({
      where: { username: username },
      data: {
        phone: phoneNumber,
        firstname,
        lastname,
        role,
        username: newUsername || username, // اگر یوزرنیم جدید وجود داشته باشد، وگرنه همان یوزرنیم قبلی
      },
    });

    // در صورت موفقیت
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    let errorResponse = { error: 'خطای داخلی سرور', field: null };

    if (error.meta && error.meta.target && error.meta.target[0] === 'phone') {
      errorResponse = {
        error: 'این شماره موبایل قبلا ثبت شده است',
        field: 'phone',
      };
      return NextResponse.json(errorResponse, { status: 409 });
    } else if (
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

export async function GET(request, { params }) {
  try {
    // دریافت نام کاربری از URL
    const { username } = params;

    // چک کردن اینکه یوزرنیم وارد شده است یا نه
    if (!username) {
      return NextResponse.json(
        { error: 'یوزرنیم مشخص نشده است' },
        { status: 400 },
      );
    }

    // پیدا کردن کاربر براساس یوزرنیم
    const user = await prismadb.user.findUnique({
      where: { username: username },
    });

    // اگر کاربر پیدا نشد
    if (!user) {
      return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
    }

    // در صورت موفقیت
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
