// app/api/admin/users/subscription/route.js  (یا هر روتی که داری)
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

function calcFinalPrice(price, discountAmount) {
  const p = Number(price || 0);
  const d = Number(discountAmount || 0);
  return Math.max(p - d, 0);
}

export async function POST(request) {
  try {
    const admin = getAuthUser();
    if (!admin?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'ADMIN')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { userId, planId, amount = 0, paymentMethod } = await request.json();

    if (!userId || !planId || !paymentMethod) {
      return NextResponse.json(
        { error: 'userId, planId, paymentMethod are required' },
        { status: 400 }
      );
    }

    const plan = await prismadb.subscriptionPlan.findUnique({
      where: { id: Number(planId) },
      select: {
        id: true,
        isActive: true,
        price: true,
        discountAmount: true,
        durationInDays: true,
        name: true,
        intervalLabel: true,
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const now = new Date();

    const last = await prismadb.userSubscription.findFirst({
      where: { userId, status: 'ACTIVE', endDate: { gte: now } },
      orderBy: { endDate: 'desc' },
      select: { endDate: true },
    });

    const startDate = last?.endDate && last.endDate > now ? last.endDate : now;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(plan.durationInDays || 0));

    const price = plan.price;
    const discountAmount = plan.discountAmount ?? 0;
    const finalPrice = calcFinalPrice(price, discountAmount);

    const created = await prismadb.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        meta: {
          source: 'ADMIN',
          amountPaid: Number(amount || 0),
          paymentMethod,
          createdByAdminId: admin.id,
          createdAt: new Date().toISOString(),

          // ✅ Snapshot قیمت و مشخصات پلن در زمان ثبت
          planSnapshot: {
            planId: plan.id,
            name: plan.name,
            intervalLabel: plan.intervalLabel,
            durationInDays: plan.durationInDays,
            price,
            discountAmount,
            finalPrice,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message:
          last?.endDate && last.endDate > now
            ? 'اشتراک ثبت شد و پس از پایان اشتراک فعلی فعال می‌شود.'
            : 'اشتراک با موفقیت فعال شد.',
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('ADMIN SUBSCRIPTION GRANT ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
