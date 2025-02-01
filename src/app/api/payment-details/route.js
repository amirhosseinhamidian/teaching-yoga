/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    const { searchParams } = request.nextUrl;
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

    const paymentRecord = await prismadb.payment.findUnique({
      where: { id: 3 },
      include: {
        cart: {
          select: {
            discountCodeId: true,
            cartCourses: {
              select: {
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

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment not found.' },
        { status: 404 },
      );
    }

    if (
      paymentRecord.status === 'SUCCESSFUL' &&
      paymentRecord.cart.discountCodeId
    ) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
      }

      const userId = session.user.userId;
      await prismadb.userDiscount.create({
        data: {
          userId,
          discountCodeId: paymentRecord.cart.discountCodeId,
        },
      });

      await prismadb.discountCode.update({
        where: { id: paymentRecord.cart.discountCodeId },
        data: { usageCount: { increment: 1 } },
      });
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
