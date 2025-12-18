// app/api/admin/users/[username]/subscriptions/[subscriptionId]/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const admin = getAuthUser();
    if (!admin?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'ADMIN')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { username, subscriptionId } = params;
    if (!username || !subscriptionId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const user = await prismadb.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const id = Number(subscriptionId);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid subscriptionId' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'CANCEL_NOW'; // CANCEL_NOW | SET_INACTIVE (اختیاری)

    const sub = await prismadb.userSubscription.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        endDate: true,
        meta: true,
      },
    });

    if (!sub || sub.userId !== user.id) {
      return NextResponse.json(
        { error: 'Subscription not found for this user' },
        { status: 404 }
      );
    }

    // اگر اشتراک قبلاً تمام شده/لغو شده، دوباره کاری نکنیم
    const now = new Date();

    let dataToUpdate = {
      status: 'CANCELED', // بهتره تو enum/statusها اضافه‌اش کنی
      meta: {
        ...(sub.meta || {}),
        canceledByAdminId: admin.id,
        canceledAt: now.toISOString(),
        cancelReason: body?.reason || null,
        cancelAction: action,
      },
    };

    // اگر می‌خوای فوراً قطع بشه:
    if (action === 'CANCEL_NOW') {
      // پایان اشتراک را همین لحظه بگذار
      dataToUpdate.endDate = now;
    }

    const updated = await prismadb.userSubscription.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('ADMIN SUBSCRIPTION CANCEL ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const admin = getAuthUser();
    if (!admin?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (admin.role !== 'ADMIN')
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { username, subscriptionId } = params;
    if (!username || !subscriptionId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const user = await prismadb.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user)
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const id = Number(subscriptionId);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid subscriptionId' },
        { status: 400 }
      );
    }

    const sub = await prismadb.userSubscription.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!sub || sub.userId !== user.id) {
      return NextResponse.json(
        { error: 'Subscription not found for this user' },
        { status: 404 }
      );
    }

    await prismadb.userSubscription.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: 'Subscription deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('ADMIN SUBSCRIPTION DELETE ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
