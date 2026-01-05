import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const whereBase = { userId };

    const [preparing, shipped, delivered, cancelled, returned, total] =
      await Promise.all([
        prismadb.shopOrder.count({
          where: { ...whereBase, status: { in: ['PROCESSING', 'PACKED'] } },
        }),
        prismadb.shopOrder.count({
          where: { ...whereBase, status: 'SHIPPED' },
        }),
        prismadb.shopOrder.count({
          where: { ...whereBase, status: 'DELIVERED' },
        }),
        prismadb.shopOrder.count({
          where: { ...whereBase, status: 'CANCELLED' },
        }),
        prismadb.shopOrder.count({
          where: { ...whereBase, status: 'RETURNED' },
        }),

        // ✅ total بدون pending
        prismadb.shopOrder.count({
          where: {
            ...whereBase,
            status: { not: 'PENDING_PAYMENT' },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      counts: { preparing, shipped, delivered, cancelled, returned },
      total,
    });
  } catch (e) {
    console.error('[PROFILE_SHOP_ORDERS_COUNTS_GET]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
