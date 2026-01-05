// src/app/api/payments/route.js
/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set(['PENDING', 'SUCCESSFUL', 'FAILED']);
const ALLOWED_METHOD = new Set(['CREDIT_CARD', 'ONLINE', 'FREE']);

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function rialToTomanCeil(rial) {
  return Math.ceil(toInt(rial, 0) / 10);
}

/**
 * خروجی آیتم‌ها + نوع خرید
 * purchaseType: COURSE | SUBSCRIPTION | SHOP | MIXED | UNKNOWN
 * items: [{ type: 'COURSE'|'SUBSCRIPTION'|'PRODUCT', id, title }]
 */
function extractPurchaseInfo(payment) {
  const courseItems =
    payment?.cart?.cartCourses?.map((cc) => ({
      type: 'COURSE',
      id: cc.course?.id,
      title: cc.course?.title || '—',
    })) || [];

  const subscriptionItems =
    payment?.cart?.cartSubscriptions?.map((cs) => ({
      type: 'SUBSCRIPTION',
      id: cs.subscriptionPlan?.id,
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

  let purchaseType = 'UNKNOWN';
  const kindsCount = [hasCourses, hasSubs, hasShop].filter(Boolean).length;

  if (kindsCount > 1) purchaseType = 'MIXED';
  else if (hasShop) purchaseType = 'SHOP';
  else if (hasSubs) purchaseType = 'SUBSCRIPTION';
  else if (hasCourses) purchaseType = 'COURSE';

  return {
    purchaseType,
    items: [...courseItems, ...subscriptionItems, ...productItems],
    counts: {
      courses: courseItems.length,
      subscriptions: subscriptionItems.length,
      products: productItems.length,
    },
  };
}

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPageRaw = parseInt(searchParams.get('perPage') || '10', 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 100);
    const search = (searchParams.get('search') || '').trim();

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const skip = (safePage - 1) * perPage;

    const where = search
      ? {
          OR: [
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { user: { phone: { contains: search } } },
            // اگر خواستی روی authority یا transactionId هم سرچ کن:
            // { authority: { contains: search } },
          ],
        }
      : {};

    const totalPayments = await prismadb.payment.count({ where });

    const payments = await prismadb.payment.findMany({
      where,
      skip,
      take: perPage,
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
            firstname: true,
            lastname: true,
            phone: true,
          },
        },

        // ✅ پرداخت‌های دیجیتال: دوره + سابسکریپشن
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

        // ✅ پرداخت‌های فروشگاه
        shopOrder: {
          select: {
            id: true,
            items: {
              select: {
                id: true,
                title: true, // اگر توی ShopOrderItem داری
                product: { select: { id: true, title: true } }, // اگر رابطه product داری
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formattedPayments = payments.map((payment) => {
      const { purchaseType, items, counts } = extractPurchaseInfo(payment);

      return {
        id: payment.id,

        // کاربر
        username: payment.user?.username || '',
        avatar: payment.user?.avatar || '',
        firstname: payment.user?.firstname || '',
        lastname: payment.user?.lastname || '',
        phone: payment.user?.phone || '',

        // ✅ نوع خرید + آیتم‌ها
        purchaseType, // COURSE | SUBSCRIPTION | SHOP | MIXED | UNKNOWN
        items, // [{type,id,title}]
        counts, // برای نمایش سریع تعدادها (اختیاری)

        // پرداخت
        kind: payment.kind, // DIGITAL | SHOP | BOTH (از مدل خودت)
        method: payment.method,
        status: payment.status,
        authority: payment.authority || null,
        transactionId: payment.transactionId
          ? String(payment.transactionId)
          : null,

        // مبلغ
        amountRial: payment.amount,
        amountToman: rialToTomanCeil(payment.amount),

        updatedAt: payment.updatedAt,
        createdAt: payment.createAt,
      };
    });

    return NextResponse.json({
      data: formattedPayments,
      meta: {
        total: totalPayments,
        page: safePage,
        perPage,
        totalPages: Math.ceil(totalPayments / perPage),
        search,
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, status, method } = body;

    const paymentId = Number(id);

    if (!Number.isFinite(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        { error: 'شناسه پرداخت نامعتبر است.' },
        { status: 400 }
      );
    }

    if (!status || !ALLOWED_STATUS.has(String(status))) {
      return NextResponse.json(
        { error: 'وضعیت پرداخت نامعتبر است.' },
        { status: 400 }
      );
    }

    if (!method || !ALLOWED_METHOD.has(String(method))) {
      return NextResponse.json(
        { error: 'نوع پرداخت نامعتبر است.' },
        { status: 400 }
      );
    }

    const updatedPayment = await prismadb.payment.update({
      where: { id: paymentId },
      data: {
        status: String(status),
        method: String(method),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);

    // اگر رکورد پیدا نشه
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'پرداخت موردنظر یافت نشد.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while updating the payment.' },
      { status: 500 }
    );
  }
}
