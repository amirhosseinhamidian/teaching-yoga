/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

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

function isAdminRole(role) {
  const r = String(role || '').toUpperCase();
  return r === 'ADMIN';
}

/**
 * status:
 * - ALL | PENDING_PAYMENT | PROCESSING | PACKED | SHIPPED | DELIVERED | CANCELLED | RETURNED
 */
function buildWhereFromSearchParams(sp) {
  const where = {};

  const status = String(sp.get('status') || 'ALL').toUpperCase();
  const paymentStatus = String(sp.get('paymentStatus') || 'ALL').toUpperCase();
  const shippingMethod = String(
    sp.get('shippingMethod') || 'ALL'
  ).toUpperCase();

  const q = normalizeFa(sp.get('q') || '');
  const id = sp.get('id'); // جستجوی دقیق شماره سفارش
  const trackingCode = normalizeFa(sp.get('trackingCode') || '');

  const dateFrom = sp.get('dateFrom'); // YYYY-MM-DD
  const dateTo = sp.get('dateTo'); // YYYY-MM-DD

  // ---- status filter
  if (status && status !== 'ALL') {
    where.status = status;
  }

  // ---- paymentStatus filter
  if (paymentStatus && paymentStatus !== 'ALL') {
    where.paymentStatus = paymentStatus;
  }

  // ---- shippingMethod filter (در مدل: POST | COURIER_COD)
  if (shippingMethod && shippingMethod !== 'ALL') {
    where.shippingMethod = shippingMethod;
  }

  // ---- direct order id
  if (id && !Number.isNaN(Number(id))) {
    where.id = Number(id);
  }

  // ---- trackingCode
  if (trackingCode) {
    where.trackingCode = { contains: trackingCode, mode: 'insensitive' };
  }

  // ---- date range
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      // شروع روز
      where.createdAt.gte = new Date(`${dateFrom}T00:00:00.000Z`);
    }
    if (dateTo) {
      // پایان روز
      where.createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
  }

  // ---- q search: fullName / phone / city / province / address / notes / trackingCode / id
  if (q) {
    const maybeId = Number(q);
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { province: { contains: q, mode: 'insensitive' } },
      { address1: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
      { trackingCode: { contains: q, mode: 'insensitive' } },
    ];

    if (!Number.isNaN(maybeId)) {
      where.OR.push({ id: maybeId });
    }
  }

  return where;
}

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ نقش ادمین
    const dbUser = await prismadb.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true },
    });

    if (!dbUser || !isAdminRole(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;

    const page = Math.max(1, toInt(searchParams.get('page') || 1, 1));
    const pageSize = Math.min(
      50,
      Math.max(10, toInt(searchParams.get('pageSize') || 10, 10))
    );
    const skip = (page - 1) * pageSize;

    // sort: newest | oldest | amount_desc | amount_asc
    const sort = String(searchParams.get('sort') || 'newest').toLowerCase();
    let orderBy = { id: 'desc' };
    if (sort === 'oldest') orderBy = { id: 'asc' };
    if (sort === 'amount_desc') orderBy = { payableOnline: 'desc' };
    if (sort === 'amount_asc') orderBy = { payableOnline: 'asc' };

    const where = buildWhereFromSearchParams(searchParams);

    const [orders, total] = await Promise.all([
      prismadb.shopOrder.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          shippingMethod: true,
          shippingTitle: true,
          shippingCost: true,
          trackingCode: true,
          postOptionKey: true,

          fullName: true,
          phone: true,
          province: true,
          city: true,

          subtotal: true,
          discountAmount: true,
          payableOnline: true,

          createdAt: true,
          updatedAt: true,

          // برای نمایش تعداد آیتم‌ها
          _count: { select: { items: true } },

          // اگر خواستی نام کاربری/آیدی یوزر هم داشته باشی:
          user: { select: { id: true, username: true } },

          // پرداخت مرتبط (اختیاری ولی مفید برای نمایش ref/authority)
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              authority: true,
              transactionId: true,
              createAt: true,
            },
          },
        },
      }),
      prismadb.shopOrder.count({ where }),
    ]);

    const hasMore = skip + orders.length < total;

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total,
      hasMore,
      orders,
    });
  } catch (e) {
    console.error('[ADMIN_SHOP_ORDERS_GET]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
