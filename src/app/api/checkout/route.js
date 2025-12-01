/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { createPayment } from '@/app/actions/zarinpal';
import { getAuthUser } from '@/utils/getAuthUser';

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, desc, cartId } = body;

    const user = getAuthUser();
    if (!user) {
      return NextResponse.json(
        { error: 'لطفا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 🟢 اطلاعات کامل کاربر از دیتابیس
    const dbUser = await prismadb.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (!dbUser.phone) {
      return NextResponse.json(
        { error: 'شماره موبایل خود را ثبت کنید.' },
        { status: 404 }
      );
    }

    // چک کردن سبد خرید
    const cart = await prismadb.cart.findFirst({
      where: { id: cartId, userId, status: 'PENDING' },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'سبد خرید نامعتبر است.' },
        { status: 400 }
      );
    }

    // چک پرداخت قبلی
    const existingPayment = await prismadb.payment.findFirst({
      where: { cartId },
      orderBy: { createAt: 'desc' },
    });

    if (existingPayment && existingPayment.status === 'SUCCESSFUL') {
      return NextResponse.json(
        { error: 'پرداخت این سبد قبلاً انجام شده است.' },
        { status: 400 }
      );
    }

    // 🟢 ارسال شماره موبایل به زرین پال از دیتابیس
    const paymentResponse = await createPayment({
      amountInRial: parseInt(amount) * 10,
      description: desc,
      mobile: dbUser.phone || null,
    });

    // به‌روزرسانی پرداخت موجود
    if (
      existingPayment &&
      ['PENDING', 'FAILED'].includes(existingPayment.status)
    ) {
      const updated = await prismadb.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: parseInt(amount) * 10,
          status: 'PENDING',
          method: 'ONLINE',
          authority: paymentResponse.authority,
        },
      });

      return NextResponse.json({
        message: 'Existing payment updated.',
        paymentResponse,
        payment: updated,
      });
    }

    // پرداخت جدید
    const newPayment = await prismadb.payment.create({
      data: {
        userId,
        cartId,
        amount: parseInt(amount) * 10,
        status: 'PENDING',
        method: 'ONLINE',
        authority: paymentResponse.authority,
      },
    });

    return NextResponse.json({
      message: 'Payment created successfully.',
      paymentResponse,
      payment: newPayment,
    });
  } catch (err) {
    console.error('Checkout Error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
