import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const { termId } = params; // گرفتن آیدی ترم از پارامتر URL

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    // حذف تمام جلسات مرتبط با ترم
    await prismadb.session.deleteMany({
      where: {
        termId: parseInt(termId),
      },
    });

    // حذف ترم
    await prismadb.term.delete({
      where: {
        id: parseInt(termId),
      },
    });

    return NextResponse.json(
      { message: 'ترم و جلسات مربتط حذف شدند.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting term and sessions:', error);
    return NextResponse.json(
      { error: 'خطا در حذف ترم و جلسات' },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const { termId } = params; // گرفتن آیدی ترم از پارامتر URL

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json(); // دریافت داده‌های ارسال شده در بدنه درخواست

    const { name, subtitle, price, discount, duration } = body; // استخراج مقادیر از بدنه درخواست

    // اعتبارسنجی مقادیر ورودی
    if (!name || !duration) {
      return NextResponse.json(
        { error: 'All fields (name, duration) are required' },
        { status: 400 },
      );
    }

    // آپدیت ترم
    const updatedTerm = await prismadb.term.update({
      where: {
        id: parseInt(termId),
      },
      data: {
        name,
        subtitle,
        price,
        discount,
        duration: parseInt(duration), // تبدیل duration به عدد
      },
    });

    return NextResponse.json(
      { message: 'ترم با موفقیت بروز شد', term: updatedTerm },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating term:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی ترم' },
      { status: 500 },
    );
  }
}
