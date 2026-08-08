import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

export async function PUT(request) {
  try {
    const body = await request.json();

    const commentId = Number(body?.commentId);
    const showOnHome = Boolean(body?.showOnHome);

    const homeOrder =
      showOnHome &&
      body?.homeOrder !== null &&
      body?.homeOrder !== undefined &&
      body?.homeOrder !== ''
        ? Number(body.homeOrder)
        : null;

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return NextResponse.json(
        {
          error: 'شناسه نظر نامعتبر است',
        },
        {
          status: 400,
        }
      );
    }

    if (
      homeOrder !== null &&
      (!Number.isInteger(homeOrder) || homeOrder <= 0)
    ) {
      return NextResponse.json(
        {
          error: 'ترتیب نمایش باید یک عدد صحیح بزرگ‌تر از صفر باشد',
        },
        {
          status: 400,
        }
      );
    }

    const comment = await prismadb.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        status: true,
        courseId: true,
        articleId: true,
        parentId: true,
        showOnHome: true,
        homeOrder: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        {
          error: 'نظر موردنظر پیدا نشد',
        },
        {
          status: 404,
        }
      );
    }

    if (comment.parentId) {
      return NextResponse.json(
        {
          error: 'پاسخ نظرات قابل نمایش در صفحه اصلی نیست',
        },
        {
          status: 400,
        }
      );
    }

    if (!comment.courseId || comment.articleId) {
      return NextResponse.json(
        {
          error: 'فقط نظرات دوره‌ها قابل نمایش در صفحه اصلی هستند',
        },
        {
          status: 400,
        }
      );
    }

    if (showOnHome && comment.status !== 'APPROVED') {
      return NextResponse.json(
        {
          error: 'ابتدا باید نظر را تأیید کنید',
        },
        {
          status: 400,
        }
      );
    }

    let resolvedHomeOrder = homeOrder;

    if (showOnHome && resolvedHomeOrder === null) {
      const lastSelectedComment = await prismadb.comment.findFirst({
        where: {
          showOnHome: true,
          status: 'APPROVED',
          courseId: {
            not: null,
          },
          parentId: null,
        },
        orderBy: {
          homeOrder: 'desc',
        },
        select: {
          homeOrder: true,
        },
      });

      resolvedHomeOrder = Number(lastSelectedComment?.homeOrder || 0) + 1;
    }

    const updatedComment = await prismadb.comment.update({
      where: {
        id: commentId,
      },
      data: {
        showOnHome,
        homeOrder: showOnHome ? resolvedHomeOrder : null,
      },
      select: {
        id: true,
        showOnHome: true,
        homeOrder: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        message: showOnHome
          ? 'نظر برای نمایش در صفحه اصلی انتخاب شد'
          : 'نظر از صفحه اصلی حذف شد',
        comment: updatedComment,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('[ADMIN_COMMENT_HOME_DISPLAY_ERROR]', error);

    return NextResponse.json(
      {
        error: 'خطایی در ذخیره تنظیمات نمایش نظر رخ داد',
      },
      {
        status: 500,
      }
    );
  }
}
