// app/api/courses/route.js
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // اگر کاربر لاگین بود، قیمت‌ها و دسترسی‌ها را شخصی‌سازی می‌کنیم
    const user = getAuthUser();
    const userId = user?.id || null;

    const courses = await prismadb.course.findMany({
      where: { activeStatus: true },
      select: {
        id: true,
        title: true,
        subtitle: true,
        isHighPriority: true,
        cover: true,
        shortAddress: true,

        // ✅ نوع قیمت‌گذاری دوره
        pricingMode: true, // TERM_ONLY | SUBSCRIPTION_ONLY | BOTH

        courseTerms: {
          select: {
            termId: true,
            term: {
              select: {
                id: true,
                price: true,
                discount: true, // درصد
              },
            },
          },
        },
      },
      orderBy: [{ isHighPriority: 'desc' }, { id: 'desc' }],
    });

    const courseIds = courses.map((c) => c.id);

    // ✅ آیا هر دوره داخل یک پلن اشتراک فعال هست؟ (برای badge / دکمه اشتراک)
    const subLinks = await prismadb.subscriptionPlanCourse.findMany({
      where: {
        courseId: { in: courseIds },
        plan: { isActive: true },
      },
      select: { courseId: true },
    });
    const isInSubscriptionSet = new Set(subLinks.map((x) => x.courseId));

    // اطلاعات خریدها/اشتراک‌های کاربر (اگر لاگین باشد)
    let userPurchasedTermIdsSet = new Set();
    let userPurchasedCourseIdsSet = new Set();
    let subscriptionAccessibleCourseIdsSet = new Set();

    if (userId) {
      const now = new Date();

      const [userTerms, userCourses, activeSubs] = await Promise.all([
        prismadb.userTerm.findMany({
          where: { userId },
          select: { termId: true },
        }),
        prismadb.userCourse.findMany({
          where: { userId, status: 'ACTIVE' },
          select: { courseId: true },
        }),
        prismadb.userSubscription.findMany({
          where: {
            userId,
            status: 'ACTIVE',
            endDate: { gte: now },
          },
          select: {
            plan: {
              select: {
                planCourses: { select: { courseId: true } },
              },
            },
          },
        }),
      ]);

      userPurchasedTermIdsSet = new Set(userTerms.map((x) => x.termId));
      userPurchasedCourseIdsSet = new Set(userCourses.map((x) => x.courseId));

      // ✅ همه courseId هایی که با اشتراک فعال قابل دسترسی‌اند
      subscriptionAccessibleCourseIdsSet = new Set(
        activeSubs.flatMap((s) => s.plan.planCourses.map((pc) => pc.courseId))
      );
    }

    const coursesWithPrices = courses.map((course) => {
      const courseTerms = Array.isArray(course.courseTerms)
        ? course.courseTerms
        : [];

      const allTerms = courseTerms.map((ct) => ct.term).filter(Boolean);

      // ✅ خرید مستقیم کل دوره
      const hasDirectCourseAccess = userId
        ? userPurchasedCourseIdsSet.has(course.id)
        : false;

      // ✅ دسترسی از طریق اشتراک
      const viaSubscription = userId
        ? subscriptionAccessibleCourseIdsSet.has(course.id)
        : false;

      // ✅ دسترسی نهایی
      const hasAccess = hasDirectCourseAccess || viaSubscription;

      // ترم‌های باقی‌مانده برای محاسبه قیمت:
      // اگر کل دوره را خریده باشد => هیچ ترمی برای قیمت باقی نمی‌ماند
      const remainingTerms = hasDirectCourseAccess
        ? []
        : allTerms.filter((t) =>
            userId ? !userPurchasedTermIdsSet.has(t.id) : true
          );

      const termCount = remainingTerms.length;

      // --- محاسبات قیمت روی ترم‌های باقی‌مانده ---
      const totalPrice = remainingTerms.reduce((sum, term) => {
        const price = Number(term?.price ?? 0);
        return sum + (Number.isFinite(price) ? price : 0);
      }, 0);

      const totalDiscountPercent = remainingTerms.reduce((sum, term) => {
        const discount = Number(term?.discount ?? 0);
        return sum + (Number.isFinite(discount) ? discount : 0);
      }, 0);

      const averageDiscount =
        termCount > 0 ? Math.ceil(totalDiscountPercent / termCount) : 0;

      const finalPriceRaw = remainingTerms.reduce((sum, term) => {
        const price = Number(term?.price ?? 0);
        const discount = Number(term?.discount ?? 0);

        const safePrice = Number.isFinite(price) ? price : 0;
        const safeDiscount = Number.isFinite(discount) ? discount : 0;

        const discountedPrice = safePrice - (safePrice * safeDiscount) / 100;
        return sum + discountedPrice;
      }, 0);

      const isSubscriptionOnly = course.pricingMode === 'SUBSCRIPTION_ONLY';

      // اگر فقط اشتراکی بود، قیمت مستقیم معنی ندارد
      const computedPrice = isSubscriptionOnly ? null : totalPrice;
      const computedDiscount = isSubscriptionOnly ? null : averageDiscount;
      const computedFinalPrice = isSubscriptionOnly
        ? null
        : Math.ceil(finalPriceRaw);

      const pricingLabel =
        course.pricingMode === 'TERM_ONLY'
          ? 'فقط خرید'
          : course.pricingMode === 'SUBSCRIPTION_ONLY'
            ? 'فقط اشتراک'
            : 'خرید + اشتراک';

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        isHighPriority: course.isHighPriority,
        cover: course.cover,
        shortAddress: course.shortAddress,

        // ✅ نوع دوره
        pricingMode: course.pricingMode,
        pricingLabel,

        // ✅ آیا این دوره داخل پلن‌های اشتراک فعال هست؟ (برای badge / دکمه اشتراک)
        isInSubscription: isInSubscriptionSet.has(course.id),

        // ✅ دسترسی کاربر
        hasAccess,
        viaSubscription,
        hasDirectCourseAccess,

        // ✅ قیمت‌های محاسبه شده (شخصی سازی شده)
        price: computedPrice,
        discount: computedDiscount,
        finalPrice: computedFinalPrice,

        // ✅ اطلاعات کمکی برای UI/دیباگ
        termCountAll: allTerms.length,
        termCountRemaining: remainingTerms.length,

        // اگر termCountRemaining == 0 و اشتراکی نبود => یعنی کاربر همه ترم‌ها را دارد
        isFullyOwned:
          !isSubscriptionOnly &&
          (hasDirectCourseAccess || remainingTerms.length === 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: coursesWithPrices,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch courses. Please try again later.',
      },
      { status: 500 }
    );
  }
}
