// src/app/api/profile/shop-orders/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

function mapUiStatusToDb(statusKey) {
  const key = String(statusKey || '').toLowerCase();

  if (key === 'preparing') return { status: { in: ['PROCESSING', 'PACKED'] } };
  if (key === 'shipped') return { status: 'SHIPPED' };
  if (key === 'delivered') return { status: 'DELIVERED' };
  if (key === 'cancelled') return { status: 'CANCELLED' };
  if (key === 'returned') return { status: 'RETURNED' };

  return { status: { in: ['PROCESSING', 'PACKED'] } };
}

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status') || 'preparing';

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(
      20,
      Math.max(5, Number(searchParams.get('pageSize') || 10))
    );
    const skip = (page - 1) * pageSize;

    const where = {
      userId: user.id,
      ...mapUiStatusToDb(status),
    };

    const [orders, total] = await Promise.all([
      prismadb.shopOrder.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          trackingCode: true,
          shippingTitle: true,
          shippingCost: true,
          postOptionKey: true,
          subtotal: true,
          discountAmount: true,
          payableOnline: true,
          shippingMethod: true,
          createdAt: true,
          updatedAt: true,
          deliveryDate: true,
          items: {
            select: {
              id: true,
              title: true,
              qty: true,
              unitPrice: true,
              coverImage: true,
              slug: true,

              color: {
                select: {
                  id: true,
                  name: true,
                  hex: true, // یا hexCode
                },
              },

              size: {
                select: {
                  id: true,
                  name: true,
                },
              },
              returnRequest: {
                select: {
                  id: true,
                  status: true,
                  reason: true,
                  qty: true,
                  description: true,
                  adminNote: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      }),
      prismadb.shopOrder.count({ where }),
    ]);

    const hasMore = skip + orders.length < total;

    return NextResponse.json({
      orders,
      page,
      pageSize,
      total,
      hasMore,
    });
  } catch (e) {
    console.error('[PROFILE_SHOP_ORDERS_GET]', e);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
