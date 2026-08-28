import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

import {
  cleanupPreviousCourseCover,
} from '@/server/media/cleanup-course-cover';

import { getMediaStorage } from '@/server/storage';

import {
  cleanupPreviousPublishedVideo,
  deleteManagedPublishedVideo,
} from '@/server/video/cleanup-previous-published-video';

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

    const updateResult = await prismadb.$transaction(async (tx) => {
      const previousCourse = await tx.course.findUnique({
        where: {
          id: courseId,
        },

        select: {
          cover: true,
          introVideoUrl: true,
        },
      });

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

        return {
          course: updatedCourse,

          previousCover:
            previousCourse?.cover ||
            null,

          previousIntroVideoUrl:
            previousCourse?.introVideoUrl ||
            null,
        };
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

      return {
        course: updatedCourse,

        previousCover:
          previousCourse?.cover ||
          null,

        previousIntroVideoUrl:
          previousCourse?.introVideoUrl ||
          null,
      };
    });

    const updated =
      updateResult.course;

    let coverCleanup = null;
    let introVideoCleanup = null;
    const warnings = [];

    if (
      updateResult.previousCover &&
      updateResult.previousCover !==
        updated.cover
    ) {
      try {
        coverCleanup =
          await cleanupPreviousCourseCover({
            storage:
              getMediaStorage(),

            previousCover:
              updateResult.previousCover,

            currentCover:
              updated.cover,
          });
      } catch (cleanupError) {
        console.error(
          '[course-update] Previous cover cleanup failed:',
          cleanupError
        );

        warnings.push(
          'دوره به‌روزرسانی شد، اما پاک‌سازی تصویر کاور قبلی کامل نشد.'
        );
      }
    }

    if (
      updateResult.previousIntroVideoUrl &&
      updateResult.previousIntroVideoUrl !==
        updated.introVideoUrl
    ) {
      try {
        introVideoCleanup =
          await cleanupPreviousPublishedVideo({
            storage:
              getMediaStorage(),

            previousOutputKey:
              updateResult.previousIntroVideoUrl,

            currentOutputKey:
              updated.introVideoUrl,
          });
      } catch (cleanupError) {
        console.error(
          '[course-update] Previous intro video cleanup failed:',
          cleanupError
        );

        warnings.push(
          'دوره به‌روزرسانی شد، اما پاک‌سازی نسخه قبلی ویدئوی معرفی کامل نشد.'
        );
      }
    }

    return NextResponse.json(
      {
        ...updated,
        cover: toAbsoluteMediaUrl(updated.cover),

        cleanup: {
          cover:
            coverCleanup,

          introVideo:
            introVideoCleanup,
        },

        warnings,
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

    let coverCleanup = null;
    let introVideoCleanup = null;
    const warnings = [];

    if (deletedCourse.cover) {
      try {
        coverCleanup =
          await cleanupPreviousCourseCover({
            storage:
              getMediaStorage(),

            previousCover:
              deletedCourse.cover,
          });
      } catch (cleanupError) {
        console.error(
          '[course-delete] Cover cleanup failed:',
          cleanupError
        );

        warnings.push(
          'دوره حذف شد، اما پاک‌سازی تصویر کاور کامل نشد.'
        );
      }
    }

    if (deletedCourse.introVideoUrl) {
      try {
        introVideoCleanup =
          await deleteManagedPublishedVideo({
            storage:
              getMediaStorage(),

            outputKey:
              deletedCourse.introVideoUrl,
          });
      } catch (cleanupError) {
        console.error(
          '[course-delete] Intro video cleanup failed:',
          cleanupError
        );

        warnings.push(
          'دوره حذف شد، اما پاک‌سازی فایل ویدئوی معرفی کامل نشد.'
        );
      }
    }

    return NextResponse.json(
      {
        message:
          warnings.length > 0
            ? `${deletedCourse.title} حذف شد، اما بخشی از پاک‌سازی فایل‌های رسانه‌ای کامل نشد.`
            : `${deletedCourse.title} با موفقیت پاک شد.`,

        cleanup: {
          cover:
            coverCleanup,

          introVideo:
            introVideoCleanup,
        },

        warnings,
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
