import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json(
        { message: 'ابتدا وارد حساب کاربری شوید.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // دریافت دوره با ترم‌ها و sessionTerms → session
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      include: {
        courseTerms: {
          include: {
            term: {
              include: {
                sessionTerms: {
                  include: {
                    session: {
                      include: {
                        video: true,
                        audio: true,
                        sessionProgress: {
                          where: { userId },
                          select: { isCompleted: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // تبدیل SessionTerm به sessions[]
    course.courseTerms.forEach((ct) => {
      const term = ct.term;

      term.sessions = term.sessionTerms
        .map((st) => st.session)
        .filter((s) => s && s.isActive) // فیلتر جلسات فعال
        .sort((a, b) => a.order - b.order);
    });

    // بررسی خرید مستقیم دوره
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId: course.id,
        status: 'ACTIVE',
      },
    });

    const hasCoursePurchase = !!userCourse;

    // بررسی این‌که این دوره در پلن‌های اشتراک وجود دارد یا نه
    const courseHasAnySubscriptionPlan =
      (await prismadb.subscriptionPlanCourse.findFirst({
        where: {
          courseId: course.id,
          plan: {
            isActive: true,
          },
        },
        select: { id: true },
      })) != null;

    // بررسی این‌که این کاربر اشتراک فعال برای این دوره دارد یا نه
    const now = new Date();
    const userActiveSubscriptionForCourse =
      (await prismadb.userSubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
          plan: {
            planCourses: {
              some: {
                courseId: course.id,
              },
            },
          },
        },
        select: { id: true },
      })) != null;

    const hasSubscriptionAccess = userActiveSubscriptionForCourse;

    // محاسبه مجموع قیمت ترم‌های این دوره (برای تشخیص فقط‌اشتراک بودن)
    const totalTermPrice =
      course.courseTerms?.reduce((sum, ct) => {
        const p = ct.term?.price || 0;
        return sum + p;
      }, 0) || 0;

    const isSubscriptionOnly =
      courseHasAnySubscriptionPlan && totalTermPrice <= 0;

    // تعیین سطح دسترسی مانند قبل + در نظر گرفتن اشتراک
    course.courseTerms.forEach((ct) => {
      ct.term.sessions.forEach((session) => {
        const media = session.video || session.audio;

        if (!media) {
          session.access = 'NO_ACCESS';
          return;
        }

        if (media.accessLevel === 'PUBLIC') {
          session.access = 'PUBLIC';
        } else if (media.accessLevel === 'REGISTERED') {
          session.access = userId ? 'REGISTERED' : 'NO_ACCESS';
        } else if (media.accessLevel === 'PURCHASED') {
          const hasAccess = hasCoursePurchase || hasSubscriptionAccess;
          session.access = hasAccess ? 'PURCHASED' : 'NO_ACCESS';
        } else {
          session.access = 'NO_ACCESS';
        }
      });
    });

    // 🔹 فلگ‌های جدید برای استفاده در فرانت
    const result = {
      ...course,
      hasSubscriptionPlan: courseHasAnySubscriptionPlan,
      isSubscriptionOnly,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in course detail API:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
