import { verifyPayment } from '@/app/actions/zarinpal';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
  const { searchParams } = req.nextUrl;
  const { Authority: authority, Status } = Object.fromEntries(
    searchParams.entries(),
  );

  if (!authority) {
    return NextResponse.json(
      { error: 'Authority parameter is required.' },
      { status: 400 },
    );
  }

  try {
    // جستجوی رکورد پرداخت در پایگاه داده
    const paymentRecord = await prismadb.payment.findUnique({
      where: { authority },
    });

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found.' },
        { status: 404 },
      );
    }

    const payment = await verifyPayment({
      amountInRial: paymentRecord.amount,
      authority,
    });

    if (![100, 101].includes(payment.data.code)) {
      return NextResponse.json(
        { error: 'Payment not verified.' },
        { status: 400 },
      );
    }
    // اگر رکورد پیدا شد، اطلاعات آن را برگردانید
    return NextResponse.json(
      {
        message: 'Payment verified.',
        payment: paymentRecord,
        status: Status, // وضعیت دریافتی از زرین‌پال
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error finding payment record:', error.message);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 },
    );
  }
};
