// src/app/api/profile/shop-orders/[id]/cancel/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

const CANCELLABLE_STATUSES = new Set(['PROCESSING', 'PACKED']);

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = Number(params?.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    const order = await prismadb.shopOrder.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        trackingCode: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // اگر پرداخت موفق نباشه، لغو معنی نداره (یا می‌تونی اجازه بدی)
    if (String(order.paymentStatus).toUpperCase() !== 'SUCCESSFUL') {
      return NextResponse.json(
        { error: 'این سفارش پرداخت موفق ندارد.' },
        { status: 400 }
      );
    }

    const status = String(order.status || '').toUpperCase();

    // idempotent
    if (status === 'CANCELLED') {
      return NextResponse.json({
        success: true,
        message: 'این سفارش قبلاً لغو شده است.',
        order: { id: order.id, status: 'CANCELLED' },
      });
    }

    // اگر ارسال شده یا تحویل شده یا مرجوع شده => لغو ممنوع
    if (!CANCELLABLE_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error:
            'لغو سفارش فقط قبل از ارسال امکان‌پذیر است. (در حال پردازش / آماده ارسال)',
        },
        { status: 400 }
      );
    }

    // اگر trackingCode ثبت شده، معمولاً یعنی آماده ارسال/ارسال شده => لغو نکن
    // (اختیاری؛ اگر خواستی trackingCode را ملاک نگیری این بخش را حذف کن)
    if (order.trackingCode) {
      return NextResponse.json(
        {
          error:
            'برای این سفارش کد رهگیری ثبت شده است و امکان لغو توسط کاربر وجود ندارد.',
        },
        { status: 400 }
      );
    }

    const updated = await prismadb.shopOrder.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        // paymentStatus رو تغییر نمی‌دیم چون پول برگشت نخورده
        // اگر سیاستت refund اتوماتیکه باید flow جدا داشته باشی
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت لغو شد.',
      order: updated,
    });
  } catch (e) {
    console.error('[PROFILE_ORDER_CANCEL]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
