import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET(request, { params }) {
  const { id } = params;

  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const courseId = parseInt(id, 10);

    const course = await prismadb.course.findUnique({
      where: {
        id: courseId,
      },
      include: {
        subscriptionPlanCourses: {
          select: {
            id: true,
            planId: true,
            courseId: true,
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

    return NextResponse.json(
      {
        ...course,
        cover: toAbsoluteMediaUrl(course.cover),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching course:', error);

    return NextResponse.json(
      {
        error: 'An error occurred while fetching the course',
      },
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
      ? subscriptionPlanIds.map(Number).filter((x) => Number.isFinite(x))
      : [];

    if (modeNeedsPlans && planIdsNormalized.length === 0) {
      return NextResponse.json(
        {
          error: 'حداقل یک پلن اشتراک باید انتخاب شود.',
        },
        { status: 400 }
      );
    }

    let validPlanIds = [];

    if (modeNeedsPlans) {
      const activePlans = await prismadb.subscriptionPlan.findMany({
        where: {
          id: {
            in: planIdsNormalized,
          },
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      validPlanIds = activePlans.map((plan) => plan.id);

      if (validPlanIds.length === 0) {
        return NextResponse.json(
          {
            error: 'پلن اشتراک معتبر/فعال یافت نشد.',
          },
          { status: 400 }
        );
      }
    }

    const updated = await prismadb.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: {
          id: courseId,
        },
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

      if (!modeNeedsPlans) {
        await tx.subscriptionPlanCourse.deleteMany({
          where: {
            courseId,
          },
        });

        return updatedCourse;
      }

      await tx.subscriptionPlanCourse.deleteMany({
        where: {
          courseId,
        },
      });

      await tx.subscriptionPlanCourse.createMany({
        data: validPlanIds.map((planId) => ({
          planId,
          courseId,
        })),
        skipDuplicates: true,
      });

      return updatedCourse;
    });

    return NextResponse.json(
      {
        ...updated,
        cover: toAbsoluteMediaUrl(updated.cover),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating course:', error);

    return NextResponse.json(
      {
        error: 'An error occurred while updating the course',
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const deletedCourse = await prismadb.course.delete({
      where: {
        id: parseInt(id, 10),
      },
    });

    return NextResponse.json(
      {
        message: `${deletedCourse.title} با موفقیت پاک شد.`,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error deleting course:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'دوره ای یافت نشد!',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error: 'An error occurred while deleting the course',
      },
      {
        status: 500,
      }
    );
  }
}
