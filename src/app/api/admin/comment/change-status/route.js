import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PUT(request) {
  try {
    // دریافت اطلاعات از هدر درخواست
    const id = request.headers.get('id');
    const status = request.headers.get('status');

    // بررسی اینکه آیا id و status ارسال شده‌اند
    if (!id || !status) {
      return new NextResponse(
        JSON.stringify({ message: 'فیلدهای id و status ضروری هستند' }),
        { status: 400 },
      );
    }

    // اعتبارسنجی وضعیت
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return new NextResponse(JSON.stringify({ message: 'وضعیت معتبر نیست' }), {
        status: 400,
      });
    }

    // به روزرسانی وضعیت کامنت در دیتابیس
    const updatedComment = await prismadb.comment.update({
      where: { id: parseInt(id, 10) },
      data: {
        status: status,
      },
    });

    // اگر کامنت یافت نشد
    if (!updatedComment) {
      return new NextResponse(
        JSON.stringify({ message: 'کامنتی با این id یافت نشد' }),
        { status: 404 },
      );
    }

    return new NextResponse(
      JSON.stringify({ message: 'وضعیت کامنت با موفقیت به روز شد' }),
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ message: 'خطا در انجام عملیات' }),
      { status: 500 },
    );
  }
}
