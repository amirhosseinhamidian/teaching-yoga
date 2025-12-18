import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

function calcFinalPrice(price, discountAmount) {
  const p = Number(price || 0);
  const d = Number(discountAmount || 0);
  return Math.max(p - d, 0);
}

export async function GET(req, { params }) {
  try {
    const admin = getAuthUser();
    if (!admin?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { username } = params;
    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 });
    }

    const user = await prismadb.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subs = await prismadb.userSubscription.findMany({
      where: { userId: user.id },
      orderBy: { startDate: 'desc' }, // ✅ مطمئن‌تر از createdAt (مگر اینکه createdAt داشته باشی)
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            durationInDays: true,
            price: true,
            discountAmount: true,
            intervalLabel: true,
          },
        },
      },
    });

    // ✅ تبدیل خروجی به شکل درست تاریخچه (قیمت زمان خرید)
    const normalized = subs.map((s) => {
      const snap = s?.meta?.planSnapshot || null;

      const price = snap?.price ?? s?.plan?.price ?? 0;
      const discountAmount =
        snap?.discountAmount ?? s?.plan?.discountAmount ?? 0;

      return {
        ...s,
        plan: s.plan
          ? {
              ...s.plan,
              price,
              discountAmount,
              finalPrice: calcFinalPrice(price, discountAmount),
            }
          : null,
      };
    });

    return NextResponse.json(
      { success: true, data: normalized },
      { status: 200 }
    );
  } catch (error) {
    console.error('ADMIN USER SUBSCRIPTIONS LIST ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
