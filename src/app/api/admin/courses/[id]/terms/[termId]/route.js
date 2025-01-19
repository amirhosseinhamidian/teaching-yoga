import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    // استخراج course ID و term ID از params
    const { id, termId } = params;

    // بررسی صحت course ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Invalid course ID.' },
        { status: 400 },
      );
    }

    // بررسی صحت term ID
    if (!termId || isNaN(parseInt(termId))) {
      return NextResponse.json({ error: 'Invalid term ID.' }, { status: 400 });
    }

    // بررسی وجود ارتباط بین دوره و ترم
    const existingConnection = await prismadb.courseTerm.findUnique({
      where: {
        courseId_termId: {
          courseId: parseInt(id),
          termId: parseInt(termId),
        },
      },
    });

    if (!existingConnection) {
      return NextResponse.json({ error: 'ترم وجود ندارد.' }, { status: 404 });
    }

    // حذف ارتباط ترم از دوره
    await prismadb.courseTerm.delete({
      where: {
        courseId_termId: {
          courseId: parseInt(id),
          termId: parseInt(termId),
        },
      },
    });

    // یافتن سبدهای خرید با وضعیت pending که شامل این ترم هستند
    const cartTerms = await prismadb.cartTerm.findMany({
      where: {
        termId: parseInt(termId),
        cart: {
          status: 'PENDING', // وضعیت سبد خرید
        },
      },
      include: {
        cart: true, // برای دسترسی به اطلاعات سبد خرید
      },
    });

    // حذف ترم از سبد خرید و به‌روزرسانی مبلغ و تخفیف
    for (const cartTerm of cartTerms) {
      const cartId = cartTerm.cartId;

      // حذف ترم از سبد خرید
      await prismadb.cartTerm.delete({
        where: { id: cartTerm.id },
      });

      // به‌روزرسانی مبلغ و تخفیف سبد خرید
      const updatedTotalPrice = cartTerm.cart.totalPrice - cartTerm.price;
      const updatedTotalDiscount =
        cartTerm.cart.totalDiscount -
        (cartTerm.price * (cartTerm.discount || 0)) / 100;

      await prismadb.cart.update({
        where: { id: cartId },
        data: {
          totalPrice: updatedTotalPrice,
          totalDiscount: updatedTotalDiscount,
        },
      });
    }

    return NextResponse.json(
      { message: 'ترم و سبدهای خرید مرتبط با موفقیت به‌روزرسانی شدند.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting term connection:', error);
    return NextResponse.json(
      { error: 'یک خطای ناشناخته رخ داده است.' },
      { status: 500 },
    );
  }
}
