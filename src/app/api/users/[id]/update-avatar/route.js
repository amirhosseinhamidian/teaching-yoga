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

    // دریافت آواتار جدید از بدنه درخواست
    const { avatar } = await request.json();

    // چک کردن اینکه آواتار وارد شده است یا نه
    if (!avatar) {
      return NextResponse.json(
        { error: 'تصویر آواتار باید مشخص شود' },
        { status: 400 },
      );
    }

    // پیدا کردن کاربر براساس id
    const user = await prismadb.user.findUnique({
      where: { id: id },
    });

    // اگر کاربر پیدا نشد
    if (!user) {
      return NextResponse.json({ error: 'کاربر پیدا نشد' }, { status: 404 });
    }

    // به‌روزرسانی آواتار کاربر
    const updatedUser = await prismadb.user.update({
      where: { id: id },
      data: {
        avatar,
      },
    });

    // در صورت موفقیت
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating avatar:', error);
    return NextResponse.json(
      { error: 'خطای داخلی سرور', field: null },
      { status: 500 },
    );
  }
}
