import { createPayment } from '@/app/actions/zarinpal';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';

export const POST = async (req) => {
  const body = await req.json();
  const { totalPrice, desc, cartId } = body;

  const session = await getServerSession(authOptions);
  const user = session?.user || null;
  if (!user) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 },
    );
  }

  const paymentResponse = await createPayment({
    amountInRial: parseInt(totalPrice) * 10,
    description: desc,
    mobile: user.phone,
  });

  // ایجاد رکورد در جدول Payment
  const newPayment = await prismadb.payment.create({
    data: {
      userId: user.id,
      cartId: cartId, // cartId باید در body درخواست ارسال شود
      amount: parseInt(totalPrice) * 10,
      status: 'PENDING', // وضعیت اولیه
      method: 'ONLINE', // روش پرداخت
      authority: paymentResponse.authority,
    },
  });

  return NextResponse.json(
    { message: 'Checkout create Successfully.', paymentResponse, newPayment },
    { status: 201 },
  );
};
