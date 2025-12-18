// app/api/admin/subscription/plans/[id]/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const user = getAuthUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = Number(params.id);
    if (Number.isNaN(planId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      description,
      features,
      price,
      discountAmount,
      durationInDays,
      intervalLabel,
      isActive,
      courseIds,
    } = body;

    const existing = await prismadb.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const normalizedCourseIds = Array.isArray(courseIds)
      ? courseIds
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x) && x > 0)
      : null; // null یعنی اصلاً قصد تغییر روابط نداریم

    const finalPlan = await prismadb.$transaction(async (tx) => {
      await tx.subscriptionPlan.update({
        where: { id: planId },
        data: {
          name: typeof name === 'string' ? name : undefined,
          description:
            typeof description === 'string' ? description : undefined,
          features: Array.isArray(features) ? features : undefined,
          price: typeof price === 'number' ? price : undefined,
          discountAmount:
            typeof discountAmount === 'number' ? discountAmount : undefined,
          durationInDays:
            typeof durationInDays === 'number' ? durationInDays : undefined,
          intervalLabel:
            typeof intervalLabel === 'string' ? intervalLabel : undefined,
          isActive: typeof isActive === 'boolean' ? isActive : undefined,
        },
      });

      if (normalizedCourseIds) {
        await tx.subscriptionPlanCourse.deleteMany({ where: { planId } });

        if (normalizedCourseIds.length > 0) {
          await tx.subscriptionPlanCourse.createMany({
            data: normalizedCourseIds.map((courseId) => ({
              planId,
              courseId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          planCourses: {
            include: {
              course: { select: { id: true, title: true, shortAddress: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(finalPlan, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SUBSCRIPTION_PLAN_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = getAuthUser();

    if (!user || !user.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = Number(params.id);
    if (Number.isNaN(planId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    // ببینیم اصلاً چنین پلنی وجود دارد یا نه
    const existing = await prismadb.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // اول روابط دوره‌ها را پاک کنیم (اختیاری، اگر onDelete: Cascade داری هم امن‌تره)
    await prismadb.subscriptionPlanCourse.deleteMany({
      where: { planId },
    });

    // بعد خود پلن را حذف کنیم
    await prismadb.subscriptionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SUBSCRIPTION_PLAN_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
