// /app/api/admin/shop/dashboard/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

const LOW_STOCK_THRESHOLD = 5;

function daysAgoDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function GET() {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'شما دسترسی لازم را ندارید.' },
        { status: 401 }
      );
    }

    const last30Days = daysAgoDate(30);

    const [
      // ردیف 1: سفارش‌ها
      pendingPayment,
      inProgress,
      shippedOrDeliveredLast30Days,

      // ردیف 2: محصولات
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,

      // ردیف 3: ارسال
      readyToShip,
      shippedNoTracking,
      returnedOrders,

      // ردیف 4: فروش
      totalSalesAgg,
      totalSuccessfulTransactions,
      salesLast30DaysAgg,
    ] = await Promise.all([
      // 1) سفارش‌های در انتظار پرداخت
      prismadb.shopOrder.count({
        where: { status: 'PENDING_PAYMENT' },
      }),

      // 2) در حال پردازش/آماده‌سازی
      prismadb.shopOrder.count({
        where: { status: { in: ['PROCESSING', 'PACKED'] } },
      }),

      // 3) ارسال‌شده/تحویل‌شده در ۳۰ روز گذشته
      prismadb.shopOrder.count({
        where: {
          status: { in: ['SHIPPED', 'DELIVERED'] },
          updatedAt: { gte: last30Days },
        },
      }),

      // محصولات: کل
      prismadb.product.count(),

      // محصولات فعال
      prismadb.product.count({ where: { isActive: true } }),

      // کم‌موجودی
      prismadb.product.count({
        where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
      }),

      // ناموجودها
      prismadb.product.count({ where: { stock: 0 } }),

      // آماده ارسال
      prismadb.shopOrder.count({ where: { status: 'PACKED' } }),

      // بدون کد رهگیری
      prismadb.shopOrder.count({
        where: {
          status: 'SHIPPED',
          OR: [{ trackingCode: null }, { trackingCode: '' }],
        },
      }),

      // مرجوعی‌ها
      prismadb.shopOrder.count({ where: { status: 'RETURNED' } }),

      // ✅ فروش کل: جمع payableOnline برای سفارش‌هایی که پرداخت موفق داشتن
      prismadb.shopOrder.aggregate({
        where: { paymentStatus: 'SUCCESSFUL' },
        _sum: { payableOnline: true },
      }),

      // تعداد فروش موفق
      prismadb.shopOrder.count({
        where: { paymentStatus: 'SUCCESSFUL' },
      }),

      // ✅ فروش ۳۰ روز گذشته: جمع payableOnline
      prismadb.shopOrder.aggregate({
        where: { paymentStatus: 'SUCCESSFUL', createdAt: { gte: last30Days } },
        _sum: { payableOnline: true },
      }),
    ]);

    const payload = {
      orders: {
        pendingPayment,
        inProgress,
        shippedOrDeliveredLast30Days,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      shipping: {
        readyToShip,
        shippedNoTracking,
        returned: returnedOrders,
      },
      sales: {
        // ✅ اگر payableOnline ممکنه null باشه، صفرش کن
        totalSales: Number(totalSalesAgg?._sum?.payableOnline || 0),
        totalSuccessfulTransactions,
        salesLast30Days: Number(salesLast30DaysAgg?._sum?.payableOnline || 0),
      },
      meta: {
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SHOP_DASHBOARD_GET]', error);
    return NextResponse.json({ error: 'خطای داخلی سرور' }, { status: 500 });
  }
}
