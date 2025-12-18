import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;

  // بررسی معتبر بودن ID
  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const courseId = parseInt(id, 10);

    const course = await prismadb.course.findUnique({
      where: { id: courseId },
      include: {
        // NEW: برای اینکه تو فرم edit لیست پلن‌ها رو داشته باشی
        subscriptionPlanCourses: {
          select: {
            id: true,
            planId: true,
            courseId: true,
            // اگر می‌خوای اسم/قیمت پلن رو هم برای نمایش داشته باشی:
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                discountAmount: true,
                durationInDays: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Error fetching course:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching the course' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;

  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  const courseId = parseInt(id, 10);

  const {
    title,
    subtitle,
    shortDescription,
    description,
    cover,
    price,
    basePrice,
    isHighPriority,
    shortAddress,
    sessionCount,
    duration,
    level,
    status,
    instructorId,
    introVideoUrl,
    pricingMode = 'TERM_ONLY',
    subscriptionPlanIds = [],
  } = await request.json();

  try {
    const modeNeedsPlans =
      pricingMode === 'SUBSCRIPTION_ONLY' || pricingMode === 'BOTH';

    const planIdsNormalized = Array.isArray(subscriptionPlanIds)
      ? subscriptionPlanIds
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x))
      : [];

    if (modeNeedsPlans && planIdsNormalized.length === 0) {
      return NextResponse.json(
        { error: 'حداقل یک پلن اشتراک باید انتخاب شود.' },
        { status: 400 }
      );
    }

    // validate پلن‌ها (اختیاری ولی بهتر)
    let validPlanIds = [];
    if (modeNeedsPlans) {
      const activePlans = await prismadb.subscriptionPlan.findMany({
        where: {
          id: { in: planIdsNormalized },
          isActive: true,
        },
        select: { id: true },
      });
      validPlanIds = activePlans.map((p) => p.id);

      if (validPlanIds.length === 0) {
        return NextResponse.json(
          { error: 'پلن اشتراک معتبر/فعال یافت نشد.' },
          { status: 400 }
        );
      }
    }

    const updated = await prismadb.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: {
          title,
          subtitle,
          shortDescription,
          description,
          cover,
          price,
          basePrice,
          isHighPriority: !!isHighPriority,
          shortAddress,
          sessionCount: Number(sessionCount),
          duration: Number(duration),
          level,
          status,
          instructorId,
          introVideoUrl,
          pricingMode,
        },
      });

      // sync پلن‌ها:
      // اگر TERM_ONLY شد => همه روابط حذف
      if (!modeNeedsPlans) {
        await tx.subscriptionPlanCourse.deleteMany({
          where: { courseId },
        });
        return updatedCourse;
      }

      // اگر SUBSCRIPTION_ONLY یا BOTH => ابتدا پاک، سپس ایجاد
      await tx.subscriptionPlanCourse.deleteMany({
        where: { courseId },
      });

      await tx.subscriptionPlanCourse.createMany({
        data: validPlanIds.map((pid) => ({
          planId: pid,
          courseId,
        })),
        skipDuplicates: true,
      });

      return updatedCourse;
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  // بررسی معتبر بودن ID
  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const courseId = parseInt(id, 10);

    // حذف دوره با Prisma
    const deletedCourse = await prismadb.course.delete({
      where: { id: courseId },
    });

    // ارسال پاسخ موفقیت
    return NextResponse.json(
      { message: `${deletedCourse.title} با موفقیت پاک شد.` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting course:', error);

    // بررسی اینکه آیا خطا مربوط به پیدا نشدن دوره است
    if (error.code === 'P2025') {
      // Prisma's record not found error
      return NextResponse.json({ error: 'دوره ای یافت نشد!' }, { status: 404 });
    }

    // سایر خطاها
    return NextResponse.json(
      { error: 'An error occurred while deleting the course' },
      { status: 500 }
    );
  }
}
