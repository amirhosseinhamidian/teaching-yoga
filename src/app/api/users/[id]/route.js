import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'شناسه کاربر مشخص نشده است' },
        { status: 400 }
      );
    }

    const { firstname, lastname, username, phone, email } =
      await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'نام کاربری باید تکمیل شود', field: 'username' },
        { status: 400 }
      );
    }

    const user = await prismadb.user.findUnique({ where: { id } });

    if (!user) {
      return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
    }

    // ===============================
    // 1) چک تکراری بودن شماره موبایل
    // ===============================
    if (phone && phone.trim() !== '') {
      const phoneOwner = await prismadb.user.findFirst({
        where: {
          phone,
          NOT: { id }, // کاربر خودش نباشد
        },
      });

      if (phoneOwner) {
        return NextResponse.json(
          {
            error: 'این شماره موبایل قبلاً ثبت شده است',
            field: 'phone',
          },
          { status: 409 }
        );
      }
    }

    // ===============================
    // 2) چک تکراری بودن نام کاربری
    // ===============================
    if (username && username !== user.username) {
      const sameUsername = await prismadb.user.findFirst({
        where: {
          username,
          NOT: { id },
        },
      });

      if (sameUsername) {
        return NextResponse.json(
          {
            error: 'این نام کاربری قبلاً ثبت شده است',
            field: 'username',
          },
          { status: 409 }
        );
      }
    }

    // ===============================
    // 3) بروزرسانی اطلاعات کاربر
    // ===============================
    const updatedUser = await prismadb.user.update({
      where: { id },
      data: {
        firstname,
        lastname,
        username,
        phone,
        ...(email && email.trim() !== '' && { email }),
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);

    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
