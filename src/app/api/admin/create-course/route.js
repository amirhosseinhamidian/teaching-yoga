import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    const {
      title,
      subtitle,
      shortDescription,
      description,
      cover,
      isHighPriority,
      shortAddress,
      sessionCount,
      duration,
      level,
      rating,
      status,
      instructorId,
      introVideoUrl,
      pricingMode = 'TERM_ONLY',
      subscriptionPlanIds = [],
    } = await request.json();

    if (
      !title ||
      !subtitle ||
      !description ||
      !cover ||
      !shortAddress ||
      !sessionCount ||
      !duration ||
      !level ||
      !status ||
      !instructorId
    ) {
      return NextResponse.json(
        { error: 'خطا در تکمیل فیلدها' },
        { status: 400 }
      );
    }

    // اگر اشتراکی یا هر دو انتخاب شده، لیست پلن‌ها باید آرایه‌ای از عدد باشد
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

    // برای جلوگیری از ثبت پلن‌های غیرفعال/نامعتبر (اختیاری ولی بهتر)
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

    // ایجاد دوره + اتصال به پلن‌ها (در یک تراکنش)
    const created = await prismadb.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          title,
          subtitle,
          shortDescription,
          description,
          cover,
          isHighPriority: !!isHighPriority,
          shortAddress,
          sessionCount: Number(sessionCount),
          duration: Number(duration),
          level,
          rating: rating || 5.0,
          status,
          instructorId,
          introVideoUrl,
          pricingMode,
        },
      });

      if (modeNeedsPlans) {
        await tx.subscriptionPlanCourse.createMany({
          data: validPlanIds.map((pid) => ({
            planId: pid,
            courseId: newCourse.id,
          })),
          skipDuplicates: true,
        });
      }

      return newCourse;
    });

    return NextResponse.json({ course: created }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
