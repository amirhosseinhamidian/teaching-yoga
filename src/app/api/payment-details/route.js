/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required.' },
        { status: 400 },
      );
    }

    const tokenNumber = parseInt(token, 10);
    if (isNaN(tokenNumber)) {
      return NextResponse.json(
        { error: 'Invalid token format.' },
        { status: 400 },
      );
    }

    console.log('Payment details ID ===> ', tokenNumber);

    const paymentRecord = await prismadb.payment.findUnique({
      where: { id: tokenNumber },
      include: {
        cart: {
          include: {
            cartCourses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    cover: true,
                    shortAddress: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log('Payment record ===> ', paymentRecord);

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found.' },
        { status: 404 },
      );
    }

    // تبدیل BigInt به string برای سریالایز کردن
    const sanitizedRecord = JSON.parse(
      JSON.stringify(paymentRecord, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return NextResponse.json(sanitizedRecord);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 },
    );
  }
};
