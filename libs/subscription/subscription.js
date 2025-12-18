// libs/subscription.js
import prismadb from '@/libs/prismadb';

// 1) گرفتن اشتراک‌های فعال کاربر
export async function getUserActiveSubscriptions(userId) {
  const now = new Date();

  return prismadb.userSubscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      endDate: {
        gte: now,
      },
    },
    include: {
      plan: {
        include: {
          planCourses: true, // تا بفهمیم چه دوره‌هایی زیر این پلن‌اند
        },
      },
    },
  });
}

// 2) آیا کاربر برای یک دوره اشتراک فعال دارد؟
export async function userHasSubscriptionForCourse(userId, courseId) {
  const now = new Date();

  const sub = await prismadb.userSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gte: now },
      plan: {
        planCourses: {
          some: {
            courseId,
          },
        },
      },
    },
  });

  return !!sub;
}

// 3) آیا کاربر این دوره را (بدون اشتراک) خریده است؟
export async function userHasPurchasedCourseOrTerms(userId, courseId) {
  // اول چک UserCourse (خرید مستقیم دوره)
  const uc = await prismadb.userCourse.findFirst({
    where: {
      userId,
      courseId,
      status: "ACTIVE",
    },
  });

  if (uc) return true;

  // اگر خرید مستقیم دوره نیست، بررسی ترم‌ها:
  // ترم‌های این دوره
  const courseTerms = await prismadb.courseTerm.findMany({
    where: { courseId },
    select: { termId: true },
  });

  if (!courseTerms.length) return false;

  const termIds = courseTerms.map((ct) => ct.termId);

  // چندتا از این ترم‌ها را کاربر خریده؟
  const userTermsCount = await prismadb.userTerm.count({
    where: {
      userId,
      termId: { in: termIds },
    },
  });

  // فرض: اگر همه‌ی ترم‌های دوره را خریده، یعنی دوره را دارد
  // اگر این منطق رو می‌خوای شُل‌تر کنی (مثلاً نصف ترم‌ها)، اینجاست که تغییر می‌دی
  return userTermsCount === termIds.length;
}

// 4) تابع کلی: آیا کاربر به دوره دسترسی دارد؟ (خرید تکی + اشتراک)
export async function userHasAccessToCourse(userId, courseId) {
  if (!userId) return false;

  // خرید تکی: دوره یا ترم‌ها
  const hasDirect = await userHasPurchasedCourseOrTerms(userId, courseId);
  if (hasDirect) return true;

  // اشتراک:
  const hasSub = await userHasSubscriptionForCourse(userId, courseId);
  return hasSub;
}
