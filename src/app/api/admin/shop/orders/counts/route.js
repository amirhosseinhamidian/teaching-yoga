/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function isAdminRole(role) {
  const r = String(role || '').toUpperCase();
  return r === 'ADMIN';
}

// اگر خواستی counts هم با همان فیلترهای لیست کار کنه، می‌تونی searchParams رو مثل لیست parse کنی.
// فعلاً counts کلی (بدون فیلتر) برای داشبورد سفارش‌هاست.
export async function GET() {
  try {
    const user = getAuthUser();
    if (!user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prismadb.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true },
    });

    if (!dbUser || !isAdminRole(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      total,
      pendingPayment,
      processing,
      packed,
      shipped,
      delivered,
      cancelled,
      returned,
    ] = await Promise.all([
      prismadb.shopOrder.count(),
      prismadb.shopOrder.count({ where: { status: 'PENDING_PAYMENT' } }),
      prismadb.shopOrder.count({ where: { status: 'PROCESSING' } }),
      prismadb.shopOrder.count({ where: { status: 'PACKED' } }),
      prismadb.shopOrder.count({ where: { status: 'SHIPPED' } }),
      prismadb.shopOrder.count({ where: { status: 'DELIVERED' } }),
      prismadb.shopOrder.count({ where: { status: 'CANCELLED' } }),
      prismadb.shopOrder.count({ where: { status: 'RETURNED' } }),
    ]);

    // آماده‌سازی = PROCESSING + PACKED
    const preparing = processing + packed;

    return NextResponse.json({
      success: true,
      total,
      counts: {
        pendingPayment,
        processing,
        packed,
        preparing,
        shipped,
        delivered,
        cancelled,
        returned,
      },
    });
  } catch (e) {
    console.error('[ADMIN_SHOP_ORDERS_COUNTS_GET]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
