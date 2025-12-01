import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const GET = async (request) => {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required.' },
        { status: 400 }
      );
    }

    const tokenNumber = parseInt(token, 10);
    if (isNaN(tokenNumber)) {
      return NextResponse.json(
        { error: 'Invalid token format.' },
        { status: 400 }
      );
    }

    const paymentRecord = await prismadb.payment.findUnique({
      where: { id: tokenNumber },
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
        { status: 404 }
      );
    }

    // ----------------------------------------
    //  اگر پرداخت موفق بوده → discount bind
    // ----------------------------------------
    if (
      paymentRecord.status === 'SUCCESSFUL' &&
      paymentRecord.cart.discountCodeId
    ) {
      const discountCodeId = paymentRecord.cart.discountCodeId;

      const discountCode = await prismadb.discountCode.findUnique({
        where: { id: discountCodeId },
      });

      if (!discountCode) {
        return NextResponse.json(
          { error: 'Discount code not found.' },
          { status: 404 }
        );
      }

      // گرفتن اطلاعات کاربر از JWT
      const authUser = getAuthUser();

      if (!authUser?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userId = authUser.id;

      // ثبت استفاده کاربر از تخفیف
      await prismadb.userDiscount.create({
        data: {
          userId,
          discountCodeId,
        },
      });

      // افزایش usageCount
      await prismadb.discountCode.update({
        where: { id: discountCodeId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // اجباراً تبدیل BigInt به string
    const sanitizedRecord = JSON.parse(
      JSON.stringify(paymentRecord, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(sanitizedRecord);
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
};
