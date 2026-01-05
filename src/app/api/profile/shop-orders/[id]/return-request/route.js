import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

function isWithinDays(date, days) {
  const d = new Date(date);
  const now = new Date();
  return now.getTime() - d.getTime() <= days * 24 * 60 * 60 * 1000;
}

export async function POST(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orderId = Number(params?.id);
    if (!orderId || Number.isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { orderItemId, reason, description, qty } = body;

    const itemId = Number(orderItemId);
    const qtyNum = Math.max(1, Number(qty || 1));

    if (!itemId || Number.isNaN(itemId)) {
      return NextResponse.json(
        { error: 'orderItemId is required.' },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required.' },
        { status: 400 }
      );
    }

    const order = await prismadb.shopOrder.findFirst({
      where: { id: orderId, userId: user.id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        updatedAt: true,
        items: { select: { id: true, qty: true } },
      },
    });

    if (!order)
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    if (String(order.paymentStatus).toUpperCase() !== 'SUCCESSFUL') {
      return NextResponse.json(
        { error: 'این سفارش پرداخت موفق ندارد.' },
        { status: 400 }
      );
    }

    // فقط سفارش تکمیل شده اجازه درخواست دارد
    if (String(order.status).toUpperCase() !== 'DELIVERED') {
      return NextResponse.json(
        {
          error: 'درخواست مرجوعی فقط برای سفارش‌های تحویل‌شده امکان‌پذیر است.',
        },
        { status: 400 }
      );
    }

    if (!isWithinDays(order.updatedAt, 7)) {
      return NextResponse.json(
        { error: 'مهلت ثبت مرجوعی (۷ روز) برای این سفارش تمام شده است.' },
        { status: 400 }
      );
    }

    const item = order.items.find((x) => x.id === itemId);
    if (!item) {
      return NextResponse.json(
        { error: 'این آیتم متعلق به این سفارش نیست.' },
        { status: 400 }
      );
    }
    if (qtyNum > Number(item.qty || 1)) {
      return NextResponse.json(
        { error: 'تعداد مرجوعی نامعتبر است.' },
        { status: 400 }
      );
    }

    // جلوگیری از تکراری شدن درخواست برای همین آیتم
    const exists = await prismadb.shopReturnRequest.findFirst({
      where: { orderId: order.id, orderItemId: itemId },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json(
        { error: 'برای این محصول قبلاً درخواست مرجوعی ثبت شده است.' },
        { status: 400 }
      );
    }

    // ✅ مهم: همزمان request ساخته شود و status سفارش RETURNED شود
    const result = await prismadb.$transaction(async (tx) => {
      const request = await tx.shopReturnRequest.create({
        data: {
          userId: user.id,
          orderId: order.id,
          orderItemId: itemId,
          qty: qtyNum,
          reason,
          description:
            typeof description === 'string' ? description.trim() : null,
          status: 'PENDING',
        },
        select: { id: true, status: true, createdAt: true },
      });

      const updatedOrder = await tx.shopOrder.update({
        where: { id: order.id },
        data: { status: 'RETURNED' }, // ✅ همان لحظه بره تو تب مرجوعی‌ها
        select: { id: true, status: true, updatedAt: true },
      });

      return { request, updatedOrder };
    });

    return NextResponse.json({
      success: true,
      message: 'درخواست مرجوعی ثبت شد و پس از بررسی به شما اطلاع داده می‌شود.',
      request: result.request,
      order: result.updatedOrder,
    });
  } catch (e) {
    console.error('[RETURN_REQUEST_CREATE]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
