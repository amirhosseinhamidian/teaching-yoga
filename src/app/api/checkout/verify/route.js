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

  const completeUrl = (token, st) =>
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=${token}&status=${st}`;

  try {
    // ✅ Payment با include لازم
    const paymentRecord = await prismadb.payment.findUnique({
      where: { authority },
      include: {
        cart: {
          include: {
            cartCourses: { include: { course: true } },
            cartSubscriptions: { include: { subscriptionPlan: true } },
          },
        },
        shopOrder: {
          include: {
            items: true,
            shopCart: { include: { items: true } },
          },
        },
      },
    });

    if (!paymentRecord) {
      return NextResponse.redirect(completeUrl('error-not-found', status));
    }

    // ✅ idempotent
    if (paymentRecord.status === 'SUCCESSFUL') {
      return NextResponse.redirect(
        completeUrl(String(paymentRecord.id), status)
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

      return NextResponse.redirect(completeUrl('error-payment-failed', status));
    }

    // 3) SUCCESSFUL کردن Payment
    const updatedPayment = await prismadb.payment.update({
      where: { authority },
      data: {
        status: 'SUCCESSFUL',
        transactionId: String(payment.data.ref_id),
      },
    });

    // ----------------------------
    // 4) اگر course cart وجود دارد → مثل قبل (ولی امن‌تر)
    // ----------------------------
    if (paymentRecord.cartId) {
      const cart = await prismadb.cart.update({
        where: { id: paymentRecord.cartId },
        data: { status: 'COMPLETED' },
        include: {
          cartCourses: { include: { course: true } },
          cartSubscriptions: { include: { subscriptionPlan: true } },
        },
      });

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
          if (!plan) continue;

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
                status: 'ACTIVE',
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
    }

    // ----------------------------
    // 5) اگر shopOrder وجود دارد → تکمیل سفارش فروشگاه
    // ----------------------------
    if (paymentRecord.shopOrderId) {
      // سفارش را با آیتم‌ها بگیر
      const order = await prismadb.shopOrder.findUnique({
        where: { id: paymentRecord.shopOrderId },
        include: {
          items: true,
          shopCart: { include: { items: true } },
        },
      });

      if (!order) throw new Error('ShopOrder not found');

      // idempotent: اگر قبلاً پرداخت شده، دوباره کم‌کردن موجودی نکن
      if (order.paymentStatus !== 'SUCCESSFUL') {
        // ✅ تراکنش اتمیک: کم کردن موجودی + آپدیت سفارش + بستن سبد
        await prismadb.$transaction(async (tx) => {
          // 1) کم کردن موجودی برای هر آیتم
          for (const it of order.items) {
            // اگر qty در orderItem هست:
            const qty = Math.max(1, Number(it.qty || 1));

            // کم کردن موجودی با گارد
            const updated = await tx.product.updateMany({
              where: {
                id: it.productId,
                stock: { gte: qty },
                isActive: true,
              },
              data: { stock: { decrement: qty } },
            });

            if (updated.count !== 1) {
              throw new Error(
                `موجودی محصول برای "${it.title || it.productId}" کافی نیست یا محصول غیرفعال است.`
              );
            }
          }

          // 2) وضعیت سفارش
          await tx.shopOrder.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'SUCCESSFUL',
              status: 'PROCESSING', // بعد از پرداخت میره پردازش
            },
          });

          // 3) وضعیت سبد فروشگاه
          if (order.shopCartId) {
            await tx.shopCart.update({
              where: { id: order.shopCartId },
              data: { status: 'CHECKED_OUT', isActive: false },
            });
          }
        });
      }
    }

    return NextResponse.redirect(
      completeUrl(String(updatedPayment.id), status)
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
