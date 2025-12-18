import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId'); // ممکنه null باشه
    const shortAddress = searchParams.get('shortAddress');

    if (!shortAddress) {
      return NextResponse.json(
        { error: 'Missing shortAddress' },
        { status: 400 }
      );
    }

    // 1) پیدا کردن دوره + pricingMode
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      select: { id: true, pricingMode: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseId = course.id;
    const pricingMode = course.pricingMode; // TERM_ONLY | SUBSCRIPTION_ONLY | BOTH

    // اگر لاگین نیست
    if (!userId || userId === 'null') {
      return NextResponse.json(
        {
          hasAccess: false,
          viaSubscription: false,
          viaPurchase: false,
          pricingMode,
        },
        { status: 403 }
      );
    }

    // 2) خرید مستقیم
    const hasPurchasedDirect = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE', // اگر status نداری، این خط رو حذف کن
      },
      select: { id: true },
    });

    // 3) دسترسی از طریق اشتراک (فقط ACTIVE و بازه معتبر)
    const now = new Date();

    const hasSubscriptionAccess = await prismadb.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE', // ✅ فقط ACTIVE
        startDate: { lte: now },
        endDate: { gte: now },
        plan: {
          planCourses: {
            some: { courseId },
          },
        },
      },
      select: { id: true, status: true, startDate: true, endDate: true },
    });

    const viaPurchase = !!hasPurchasedDirect;
    const viaSubscription = !!hasSubscriptionAccess;
    const hasAccess = viaPurchase || viaSubscription;

    if (!hasAccess) {
      return NextResponse.json(
        {
          hasAccess: false,
          viaSubscription: false,
          viaPurchase: false,
          pricingMode,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        hasAccess: true,
        viaSubscription,
        viaPurchase,
        pricingMode,
        // اگر خواستی برای UI تاریخ اشتراک فعال هم بده:
        subscription: viaSubscription
          ? {
              startDate: hasSubscriptionAccess.startDate,
              endDate: hasSubscriptionAccess.endDate,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
