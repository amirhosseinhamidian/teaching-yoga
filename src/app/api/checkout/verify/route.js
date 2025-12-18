/* eslint-disable no-undef */
import { verifyPayment } from '@/libs/zarinpal';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = async (req) => {
  const { searchParams } = req.nextUrl;
  const authority = searchParams.get('Authority');
  const status = searchParams.get('Status') || 'NOK';
  const type = searchParams.get('type') || null; // فعلاً استفاده نشده

  if (!authority) {
    return NextResponse.json(
      { error: 'Authority parameter is required.' },
      { status: 400 }
    );
  }

  try {
    const paymentRecord = await prismadb.payment.findUnique({
      where: { authority },
    });

    if (!paymentRecord) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=error-not-found&status=${status}`
      );
    }

    // ✅ idempotent
    if (paymentRecord.status === 'SUCCESSFUL') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=${paymentRecord.id}&status=${status}`
      );
    }

    // 2) Verify با زرین‌پال
    const payment = await verifyPayment({
      amountInRial: paymentRecord.amount,
      authority,
    });

    if (![100, 101].includes(payment?.data?.code)) {
      await prismadb.payment.update({
        where: { authority },
        data: { status: 'FAILED' },
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=error-payment-failed&status=${status}`
      );
    }

    // 3) SUCCESSFUL کردن Payment
    const updatedPayment = await prismadb.payment.update({
      where: { authority },
      data: {
        status: 'SUCCESSFUL',
        transactionId: String(payment.data.ref_id),
      },
    });

    // 4) تکمیل Cart
    const cart = await prismadb.cart.update({
      where: { id: updatedPayment.cartId },
      data: { status: 'COMPLETED' },
      include: {
        cartCourses: { include: { course: true } },
        cartSubscriptions: { include: { subscriptionPlan: true } },
      },
    });

    if (!cart) throw new Error('Cart not found');

    const now = new Date();

    // 🟣 A) اشتراک‌ها
    if (cart.cartSubscriptions?.length) {
      for (const item of cart.cartSubscriptions) {
        let plan = item.subscriptionPlan;
        if (!plan) {
          plan = await prismadb.subscriptionPlan.findUnique({
            where: { id: item.subscriptionPlanId },
          });
        }

        if (!plan) {
          console.error('[VERIFY_SUBSCRIPTION] Plan not found:', item?.id);
          continue;
        }

        // اگر کاربر اشتراک فعال دارد، اشتراک جدید بعد از آن شروع شود
        const latestActiveSub = await prismadb.userSubscription.findFirst({
          where: {
            userId: paymentRecord.userId,
            status: 'ACTIVE',
            endDate: { gte: now },
          },
          orderBy: { endDate: 'desc' },
        });

        let startDate = now;
        if (latestActiveSub?.endDate && latestActiveSub.endDate > now) {
          startDate = latestActiveSub.endDate;
        }

        const durationDays = Number(plan.durationInDays || 0);
        const endDate = new Date(
          startDate.getTime() + durationDays * 24 * 60 * 60 * 1000
        );

        // ✅ Snapshot قیمت از آیتم سبد
        const basePriceAtPurchase = Number(item.price || 0);
        const discountAmountAtPurchase = Number(item.discount || 0);
        const finalPriceAtPurchase = Math.max(
          basePriceAtPurchase - discountAmountAtPurchase,
          0
        );

        const metaSnapshot = {
          plan: {
            id: plan.id,
            name: plan.name,
            intervalLabel: plan.intervalLabel ?? null,
            durationInDays: plan.durationInDays ?? null,
          },
          pricing: {
            basePrice: basePriceAtPurchase,
            discountAmount: discountAmountAtPurchase,
            finalPrice: finalPriceAtPurchase,
            currency: 'IRT',
          },
          source: 'USER',
          payment: {
            authority: updatedPayment.authority,
            transactionId: String(payment.data.ref_id),
            amountPaid: updatedPayment.amount, // ریال
          },
          createdAt: new Date().toISOString(),
        };

        // ✅ جلوگیری از ایجاد تکراری (verify دوباره)
        const alreadyCreated = await prismadb.userSubscription.findFirst({
          where: {
            userId: paymentRecord.userId,
            planId: plan.id,
            startDate,
            endDate,
          },
        });

        if (!alreadyCreated) {
          await prismadb.userSubscription.create({
            data: {
              userId: paymentRecord.userId,
              planId: plan.id,
              status: 'ACTIVE', // اگر enum PENDING نداری، اینجا ACTIVE می‌مونه
              startDate,
              endDate,
              meta: metaSnapshot,
            },
          });
        }
      }
    }

    // 🟠 B) دوره‌ها
    if (cart.cartCourses?.length) {
      const courses = cart.cartCourses.map((cc) => cc.course).filter(Boolean);

      for (const course of courses) {
        await prismadb.userCourse.upsert({
          where: {
            userId_courseId: {
              userId: paymentRecord.userId,
              courseId: course.id,
            },
          },
          update: {},
          create: {
            userId: paymentRecord.userId,
            courseId: course.id,
          },
        });
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=${updatedPayment.id}&status=${status}`
    );
  } catch (error) {
    console.error('Error verifying payment:', error?.message);

    try {
      await prismadb.payment.update({
        where: { authority },
        data: { status: 'FAILED' },
      });
    } catch (e) {
      console.error('Error updating payment to FAILED:', e?.message);
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=error-something-went-wrong&status=NOK`
    );
  }
};
