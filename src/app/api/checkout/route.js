import { createPayment } from '@/app/actions/zarinpal';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';

export const POST = async (req) => {
  const body = await req.json();
  const { amount, desc, cartId } = body;

  const session = await getServerSession(authOptions);
  const user = session?.user || null;

  if (!user) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 },
    );
  }

  // بررسی وجود سبد خرید با وضعیت PENDING و cardId مطابق
  const validCart = await prismadb.cart.findFirst({
    where: {
      id: cartId, // بررسی cardId ارسال شده
      userId: user.id, // مطمئن شدن از اینکه این سبد متعلق به این کاربر است
      status: 'PENDING', // بررسی وضعیت PENDING
    },
  });

  if (!validCart) {
    return NextResponse.json(
      {
        error:
          'Invalid cart. Either the cart does not exist or it is not in a valid state.',
      },
      { status: 400 },
    );
  }

  // بررسی پرداخت‌های قبلی برای این cartId
  const existingPayment = await prismadb.payment.findFirst({
    where: {
      cartId,
    },
    orderBy: {
      createAt: 'desc', // جدیدترین پرداخت را بررسی کنید
    },
  });

  if (existingPayment && existingPayment.status === 'SUCCESSFUL') {
    return NextResponse.json(
      { error: 'پرداخت برای این سبد خرید قبلا با موفقیت انجام شده است.' },
      { status: 400 },
    );
  }
  // ایجاد پرداخت جدید
  const paymentResponse = await createPayment({
    amountInRial: parseInt(amount) * 10,
    description: desc,
    mobile: user?.userPhone,
  });

  if (
    (existingPayment && existingPayment.status === 'PENDING') ||
    (existingPayment && existingPayment.status === 'FAILED')
  ) {
    const updatedPayment = await prismadb.payment.update({
      where: { id: existingPayment.id },
      data: {
        amount: parseInt(amount) * 10,
        status: 'PENDING', // به‌روزرسانی وضعیت به PENDING
        method: 'ONLINE',
        authority: paymentResponse.authority,
      },
    });

    return NextResponse.json(
      {
        message: 'Existing payment updated.',
        paymentResponse,
        payment: updatedPayment,
      },
      { status: 200 },
    );
  } else {
    // ایجاد رکورد در جدول Payment
    const newPayment = await prismadb.payment.upsert({
      where: { cartId },
      update: {
        amount: parseInt(amount) * 10,
        status: 'PENDING', // بروزرسانی وضعیت
        method: 'ONLINE',
        authority: paymentResponse.authority, // بروزرسانی authority
      },
      create: {
        userId: user.userId,
        cartId: cartId,
        amount: parseInt(amount) * 10,
        status: 'PENDING',
        method: 'ONLINE',
        authority: paymentResponse.authority,
      },
    });

    return NextResponse.json(
      {
        message: 'Checkout created successfully.',
        paymentResponse,
        payment: newPayment,
      },
      { status: 201 },
    );
  }
};
