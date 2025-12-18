import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getAuthUser();

    // اگر لاگین نیست، صرفاً بگو اشتراک ندارد
    if (!user || !user.id) {
      return NextResponse.json(
        {
          hasActiveSubscription: false,
          remainingDays: 0,
          planName: null,
          endDate: null,
        },
        { status: 200 }
      );
    }

    const now = new Date();

    const activeSub = await prismadb.userSubscription.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        endDate: {
          gte: now,
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    if (!activeSub) {
      return NextResponse.json(
        {
          hasActiveSubscription: false,
          remainingDays: 0,
          planName: null,
          endDate: null,
        },
        { status: 200 }
      );
    }

    const endDate = activeSub.endDate;
    const diffMs = endDate.getTime() - now.getTime();
    const remainingDays = Math.max(
      0,
      Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    );

    return NextResponse.json(
      {
        hasActiveSubscription: true,
        remainingDays,
        planName: activeSub.plan?.name || null,
        endDate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SUBSCRIPTION_STATUS]', error);
    return NextResponse.json(
      {
        hasActiveSubscription: false,
        remainingDays: 0,
        planName: null,
        endDate: null,
      },
      { status: 500 }
    );
  }
}
