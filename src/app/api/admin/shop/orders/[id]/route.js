/* eslint-disable no-prototype-builtins */
/* eslint-disable no-undef */
// src/app/api/admin/shop/orders/[id]/route.js

import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'MANAGER';
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function normalizeFa(s) {
  return String(s || '')
    .trim()
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeOrNull(s) {
  const v = normalizeFa(s);
  return v ? v : null;
}

export async function GET(req, { params }) {
  try {
    const user = getAuthUser();
    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = toInt(params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const order = await prismadb.shopOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            phone: true,
          },
        },
        payment: true,

        items: {
          include: {
            product: { select: { id: true, title: true, slug: true } },
            // ✅ اگر ریلیشن رنگ/سایز را روی ShopOrderItem اضافه کردی
            color: { select: { id: true, name: true, hex: true } },
            size: { select: { id: true, name: true } },
          },
        },

        // ✅ درخواست‌های مرجوعی همین سفارش
        returnRequests: {
          orderBy: { id: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstname: true,
                lastname: true,
                phone: true,
              },
            },
            orderItem: {
              include: {
                product: { select: { id: true, title: true, slug: true } },
                color: { select: { id: true, name: true, hex: true } },
                size: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (e) {
    console.error('[ADMIN_ORDER_DETAIL_GET]', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const id = Number(params?.id);
    if (!id || Number.isNaN(id))
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const order = await prismadb.shopOrder.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discountAmount: true,
        payableOnline: true,
        payableCOD: true,
        shippingCost: true,
        shippingMethod: true,
        shippingTitle: true,
        postOptionKey: true,
      },
    });

    if (!order)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const patch = {};

    if (body.status != null) patch.status = String(body.status).toUpperCase();

    if (body.trackingCode !== undefined) {
      patch.trackingCode = body.trackingCode
        ? String(body.trackingCode).trim()
        : null;
    }

    // ✅ shipping edits
    const hasShippingCost =
      body.shippingCost !== undefined && body.shippingCost !== null;
    const hasShippingTitle = body.shippingTitle !== undefined;
    const hasShippingMethod = body.shippingMethod !== undefined;
    const hasPostOptionKey = body.postOptionKey !== undefined;

    let nextShippingCost = order.shippingCost;
    let nextShippingMethod = String(
      order.shippingMethod || 'POST'
    ).toUpperCase();

    if (hasShippingCost) {
      nextShippingCost = toInt(body.shippingCost, order.shippingCost);
      if (nextShippingCost < 0) nextShippingCost = 0; // اگر خواستی -1 مجاز باشه، این خط رو بردار
      patch.shippingCost = nextShippingCost;
    }

    if (hasShippingMethod) {
      const m = String(body.shippingMethod || '').toUpperCase();
      nextShippingMethod = m === 'COURIER_COD' ? 'COURIER_COD' : 'POST';
      patch.shippingMethod = nextShippingMethod;
    }

    if (hasShippingTitle) {
      patch.shippingTitle = normalizeOrNull(body.shippingTitle);
    }

    if (hasPostOptionKey) {
      patch.postOptionKey = body.postOptionKey
        ? String(body.postOptionKey).trim()
        : null;
    }

    /**
     * ✅ recalculation rules:
     * فقط اگر پرداخت موفق نیست، payable ها رو recompute کن.
     */
    const paid =
      String(order.paymentStatus || '').toUpperCase() === 'SUCCESSFUL';

    if (!paid && (hasShippingCost || hasShippingMethod)) {
      const subtotal = toInt(order.subtotal, 0);
      const discount = Math.max(0, toInt(order.discountAmount, 0));

      if (nextShippingMethod === 'COURIER_COD') {
        patch.payableOnline = Math.max(0, subtotal - discount);
        patch.payableCOD = Math.max(0, nextShippingCost);
      } else {
        patch.payableOnline = Math.max(
          0,
          subtotal - discount + Math.max(0, nextShippingCost)
        );
        patch.payableCOD = 0;
      }
    }

    const updated = await prismadb.shopOrder.update({
      where: { id: order.id },
      data: patch,
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true, slug: true } },
            color: { select: { id: true, name: true, hex: true } },
            size: { select: { id: true, name: true } },
          },
        },
        returnRequests: {
          orderBy: { id: 'desc' },
          include: {
            orderItem: {
              include: {
                product: { select: { id: true, title: true, slug: true } },
                color: { select: { id: true, name: true, hex: true } },
                size: { select: { id: true, name: true } },
              },
            },
            user: { select: { id: true, username: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'سفارش بروزرسانی شد.',
      order: updated,
      warnings:
        paid && (hasShippingCost || hasShippingMethod)
          ? [
              'پرداخت موفق بوده؛ payableOnline/payableCOD برای جلوگیری از ناسازگاری تغییر داده نشد.',
            ]
          : [],
    });
  } catch (e) {
    console.error('[ADMIN_ORDER_PATCH]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
