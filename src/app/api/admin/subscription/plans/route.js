// app/api/admin/subscription/plans/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getAuthUser();

    if (!user || !user.id || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prismadb.subscriptionPlan.findMany({
      include: {
        planCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                shortAddress: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SUBSCRIPTION_PLANS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user?.id || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      isActive = true,
      courseIds = [],
    } = body;

    if (!name || !price || !durationInDays || !intervalLabel) {
      return NextResponse.json(
        { error: 'name, price, durationInDays, intervalLabel are required' },
        { status: 400 }
      );
    }

    const normalizedCourseIds = Array.isArray(courseIds)
      ? courseIds
          .map((x) => Number(x))
          .filter((x) => Number.isFinite(x) && x > 0)
      : [];

    const plan = await prismadb.$transaction(async (tx) => {
      const created = await tx.subscriptionPlan.create({
        data: {
          name: String(name),
          description: typeof description === 'string' ? description : null,
          features: Array.isArray(features) ? features : undefined,
          price: Number(price),
          discountAmount:
            discountAmount === '' || discountAmount == null
              ? 0
              : Number(discountAmount),
          durationInDays: Number(durationInDays),
          intervalLabel: String(intervalLabel),
          isActive: !!isActive,
        },
      });

      if (normalizedCourseIds.length > 0) {
        await tx.subscriptionPlanCourse.createMany({
          data: normalizedCourseIds.map((courseId) => ({
            planId: created.id,
            courseId,
          })),
          skipDuplicates: true,
        });
      }

      // خروجی نهایی با include
      return tx.subscriptionPlan.findUnique({
        where: { id: created.id },
        include: {
          planCourses: {
            include: {
              course: { select: { id: true, title: true, shortAddress: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('[ADMIN_SUBSCRIPTION_PLANS_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
