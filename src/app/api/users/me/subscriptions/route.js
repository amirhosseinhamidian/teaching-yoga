// app/api/users/me/subscriptions/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

function calcFinalPrice(price, discountAmount) {
  const p = Number(price || 0);
  const d = Number(discountAmount || 0);
  return Math.max(p - d, 0);
}

function diffDaysCeil(toDate) {
  const t = new Date(toDate).getTime();
  const now = Date.now();
  return Math.max(Math.ceil((t - now) / (1000 * 60 * 60 * 24)), 0);
}

function getState(startDate, endDate) {
  const now = Date.now();
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();

  if (now < s) return 'PENDING_START'; // در انتظار فعال‌سازی
  if (now <= e) return 'ACTIVE_NOW'; // فعال
  return 'EXPIRED'; // پایان یافته
}

export async function GET() {
  try {
    const user = getAuthUser();
    const userId = user?.id || null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // ✅ ACTIVE هایی که هنوز تمام نشده‌اند (چه شروع شده باشند، چه در آینده شروع شوند)
    const subs = await prismadb.userSubscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' }, // صف را از نزدیک‌ترین شروع مرتب کنیم
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            durationInDays: true,
            price: true,
            discountAmount: true,
            intervalLabel: true,
            planCourses: {
              select: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    cover: true,
                    shortAddress: true,
                    activeStatus: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const activeSubscriptions = subs.map((s) => {
      const plan = s.plan;
      const finalPrice = calcFinalPrice(plan?.price, plan?.discountAmount);
      const state = getState(s.startDate, s.endDate);

      return {
        id: s.id,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        state, // ACTIVE_NOW | PENDING_START | EXPIRED
        remainingDaysToStart:
          state === 'PENDING_START' ? diffDaysCeil(s.startDate) : 0,
        remainingDaysToEnd: state !== 'EXPIRED' ? diffDaysCeil(s.endDate) : 0,

        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              durationInDays: plan.durationInDays,
              price: plan.price,
              discountAmount: plan.discountAmount,
              finalPrice,
              intervalLabel: plan.intervalLabel,
            }
          : null,

        courses:
          plan?.planCourses
            ?.map((x) => x.course)
            .filter(Boolean)
            .filter((c) => c.activeStatus !== false)
            .map((c) => ({
              id: c.id,
              title: c.title,
              cover: c.cover,
              shortAddress: c.shortAddress,
            })) || [],
      };
    });

    // ✅ دوره‌های قابل دسترسی فقط از اشتراک‌هایی که الآن فعال هستند
    const courseMap = new Map();
    for (const s of activeSubscriptions) {
      if (s.state !== 'ACTIVE_NOW') continue;
      for (const c of s.courses || []) {
        courseMap.set(c.id, c);
      }
    }

    const accessibleCourses = Array.from(courseMap.values());

    return NextResponse.json(
      {
        success: true,
        data: {
          subscriptions: activeSubscriptions, // شامل در انتظار هم هست
          accessibleCourses, // فقط اشتراک‌های فعالِ الآن
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ME_SUBSCRIPTIONS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
