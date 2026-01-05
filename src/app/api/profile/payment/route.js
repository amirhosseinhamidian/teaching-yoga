// src/app/api/shop/payments/route.js  (یا هر مسیری که الان داری)
/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function rialToTomanCeil(rial) {
  return Math.ceil(toInt(rial, 0) / 10);
}

function extractPurchaseInfo(payment) {
  const courseItems =
    payment?.cart?.cartCourses?.map((cc) => ({
      type: 'COURSE',
      id: cc.course?.id ?? null,
      title: cc.course?.title || '—',
    })) || [];

  const subscriptionItems =
    payment?.cart?.cartSubscriptions?.map((cs) => ({
      type: 'SUBSCRIPTION',
      id: cs.subscriptionPlan?.id ?? null,
      title: cs.subscriptionPlan?.name || '—',
    })) || [];

  const productItems =
    payment?.shopOrder?.items?.map((it) => ({
      type: 'PRODUCT',
      id: it.product?.id ?? null,
      title: it.product?.title || it.title || '—',
    })) || [];

  const hasCourses = courseItems.length > 0;
  const hasSubs = subscriptionItems.length > 0;
  const hasShop = productItems.length > 0;

  const kindsCount = [hasCourses, hasSubs, hasShop].filter(Boolean).length;

  let purchaseType = 'UNKNOWN';
  if (kindsCount > 1) purchaseType = 'MIXED';
  else if (hasShop) purchaseType = 'SHOP';
  else if (hasSubs) purchaseType = 'SUBSCRIPTION';
  else if (hasCourses) purchaseType = 'COURSE';

  return {
    purchaseType,
    items: [...courseItems, ...subscriptionItems, ...productItems],
  };
}

export async function GET() {
  try {
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    const payments = await prismadb.payment.findMany({
      where: { userId },
      include: {
        cart: {
          select: {
            cartCourses: {
              select: {
                course: { select: { id: true, title: true } },
              },
            },
            cartSubscriptions: {
              select: {
                subscriptionPlan: { select: { id: true, name: true } },
              },
            },
          },
        },
        shopOrder: {
          select: {
            id: true,
            items: {
              select: {
                id: true,
                title: true, // اگر ShopOrderItem title داشته باشد
                product: { select: { id: true, title: true } }, // اگر relation دارد
              },
            },
          },
        },
      },
      orderBy: { createAt: 'desc' },
    });

    const paymentDetails = payments.map((payment) => {
      const { purchaseType, items } = extractPurchaseInfo(payment);

      return {
        id: payment.id,
        transactionId: payment.transactionId?.toString() || '0', // BigInt → string
        authority: payment.authority || null,

        purchaseType, // COURSE | SUBSCRIPTION | SHOP | MIXED | UNKNOWN
        items, // [{type,id,title}]

        status: payment.status,
        method: payment.method,
        kind: payment.kind, // DIGITAL | SHOP | BOTH

        amountRial: payment.amount,
        amountToman: rialToTomanCeil(payment.amount),

        updatedAt: payment.updatedAt,
        createdAt: payment.createAt,
      };
    });

    return NextResponse.json(paymentDetails, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
