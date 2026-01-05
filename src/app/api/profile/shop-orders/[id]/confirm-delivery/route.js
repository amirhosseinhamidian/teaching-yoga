// src/app/api/profile/shop-orders/[id]/confirm-delivery/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

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
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (String(order.paymentStatus).toUpperCase() !== 'SUCCESSFUL') {
      return NextResponse.json(
        { error: 'این سفارش پرداخت موفق ندارد.' },
        { status: 400 }
      );
    }

    const status = String(order.status || '').toUpperCase();

    // idempotent
    if (status === 'DELIVERED') {
      return NextResponse.json({
        success: true,
        message: 'این سفارش قبلاً تحویل شده است.',
        order: { id: order.id, status: 'DELIVERED' },
      });
    }

    // فقط وقتی سفارش ارسال شده است
    if (status !== 'SHIPPED') {
      return NextResponse.json(
        { error: 'تایید تحویل فقط برای سفارش‌های ارسال‌شده امکان‌پذیر است.' },
        { status: 400 }
      );
    }

    const updated = await prismadb.shopOrder.update({
      where: { id: order.id },
      data: {
        status: 'DELIVERED',
        deliveryDate: new Date(), // ✅ این فیلد در مدل داری
      },
      select: {
        id: true,
        status: true,
        deliveryDate: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تحویل سفارش ثبت شد.',
      order: updated,
    });
  } catch (e) {
    console.error('[PROFILE_ORDER_CONFIRM_DELIVERY]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
