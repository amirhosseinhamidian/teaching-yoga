/* eslint-disable no-undef */
// src/app/api/admin/shop/return-requests/[id]/status/route.js

import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

const ALLOWED = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];

function isAdmin(user) {
  const r = String(user?.role || '').toUpperCase();
  return r === 'ADMIN' || r === 'MANAGER';
}

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = Number(params?.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid request id' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const nextStatus = String(body?.status || '').toUpperCase();
    const adminNote =
      typeof body?.adminNote === 'string' ? body.adminNote.trim() : null;

    if (!ALLOWED.includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const reqRecord = await prismadb.shopReturnRequest.findUnique({
      where: { id },
      select: { id: true, orderId: true, status: true },
    });

    if (!reqRecord)
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );

    // آپدیت درخواست
    const updated = await prismadb.shopReturnRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        adminNote,
      },
      include: {
        orderItem: { select: { id: true, title: true, qty: true } },
      },
    });

    /**
     * ✅ منطق وضعیت سفارش:
     * - اگر حداقل یک درخواست PENDING/APPROVED/COMPLETED وجود داشته باشد => سفارش RETURNED بماند
     * - اگر همه درخواست‌ها REJECTED شدند => اگر سفارش قبلاً DELIVERED بوده، برگردان به DELIVERED
     *
     * (تو گفتی: وقتی درخواست ثبت شد، order.status=RETURNED؛ اگر ادمین رد کرد، می‌تواند برگردد.)
     */
    const all = await prismadb.shopReturnRequest.findMany({
      where: { orderId: updated.orderId },
      select: { status: true },
    });

    const hasActive = all.some((x) =>
      ['PENDING', 'APPROVED', 'COMPLETED'].includes(
        String(x.status).toUpperCase()
      )
    );
    const allRejected =
      all.length > 0 &&
      all.every((x) => String(x.status).toUpperCase() === 'REJECTED');

    if (hasActive) {
      await prismadb.shopOrder.update({
        where: { id: updated.orderId },
        data: { status: 'RETURNED' },
      });
    } else if (allRejected) {
      // برگشت به DELIVERED (یا حالت قبلی اگر خواستی بعداً ذخیره کنیم)
      await prismadb.shopOrder.update({
        where: { id: updated.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'وضعیت درخواست بروزرسانی شد.',
      request: updated,
      orderStatusRule: { hasActive, allRejected },
    });
  } catch (e) {
    console.error('[ADMIN_RETURN_REQUEST_STATUS_PATCH]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
