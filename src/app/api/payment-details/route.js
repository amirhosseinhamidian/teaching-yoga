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
    if (Number.isNaN(tokenNumber)) {
      return NextResponse.json(
        { error: 'Invalid token format.' },
        { status: 400 }
      );
    }

    // ✅ اگر پرداخت موفق شد و قرار است bind discount انجام شود
    // باید یوزر لاگین باشد (همان رفتار قبلی)
    const authUser = getAuthUser(); // اگر async هست، await بگذار
    const authUserId = authUser?.id || null;

    const paymentRecord = await prismadb.payment.findUnique({
      where: { id: tokenNumber },
      include: {
        // -------------------
        // Courses/Subscriptions
        // -------------------
        cart: {
          select: {
            id: true,
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
            cartSubscriptions: {
              select: {
                id: true,
                price: true,
                discount: true,
                subscriptionPlan: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    durationInDays: true,
                    intervalLabel: true,
                    price: true,
                    discountAmount: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },

        // -------------------
        // Shop order
        // -------------------
        shopOrder: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            trackingCode: true,
            shippingTitle: true,
            shippingMethod: true,
            shippingCost: true,
            subtotal: true,
            discountAmount: true,
            payableOnline: true,
            payableCOD: true,
            createdAt: true,

            fullName: true,
            phone: true,
            province: true,
            city: true,
            address1: true,
            postalCode: true,

            items: {
              select: {
                id: true,
                productId: true,
                qty: true,
                title: true,
                unitPrice: true,
                coverImage: true,
                slug: true,
                colorId: true,
                sizeId: true,
              },
            },

            // اگر برای نمایش در UI لازم داری:
            shopCartId: true,
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

    // ✅ امنیت ساده: فقط صاحب پرداخت بتواند جزئیات را ببیند
    // (در نسخه قبلی نداشتی؛ ولی چون با credentials include صدا می‌زنی بهتره)
    if (
      authUserId &&
      paymentRecord.userId &&
      paymentRecord.userId !== authUserId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ----------------------------------------------------
    // ✅ Bind discount code (دوره‌ها) - idempotent
    // فقط وقتی پرداخت SUCCESSFUL است و cart.discountCodeId دارد
    // ----------------------------------------------------
    if (
      paymentRecord.status === 'SUCCESSFUL' &&
      paymentRecord.cart?.discountCodeId
    ) {
      const discountCodeId = paymentRecord.cart.discountCodeId;

      // باید لاگین باشد تا userDiscount ثبت شود
      if (!authUserId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // وجود کد تخفیف را چک می‌کنیم
      const discountCode = await prismadb.discountCode.findUnique({
        where: { id: discountCodeId },
        select: { id: true },
      });

      if (discountCode) {
        // ✅ جلوگیری از تکراری (به جای create خام)
        // اگر قبلاً ثبت شده باشد، دیگر usageCount هم افزایش نده
        const alreadyUsed = await prismadb.userDiscount.findFirst({
          where: { userId: authUserId, discountCodeId },
          select: { id: true },
        });

        if (!alreadyUsed) {
          await prismadb.$transaction([
            prismadb.userDiscount.create({
              data: { userId: authUserId, discountCodeId },
            }),
            prismadb.discountCode.update({
              where: { id: discountCodeId },
              data: { usageCount: { increment: 1 } },
            }),
          ]);
        }
      }
    }

    // ----------------------------------------------------
    // (اختیاری) Bind discount code (فروشگاه)
    // اگر تصمیم گرفتی برای shopCart هم userDiscount ثبت شود
    // فعلاً چون shopOrder.discountCodeId در مدل نداری و shopCart هم include نکردیم،
    // این بخش را عمداً نیاوردم تا با ساختارت تداخل ایجاد نکند.
    // ----------------------------------------------------

    // ✅ BigInt → string
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
