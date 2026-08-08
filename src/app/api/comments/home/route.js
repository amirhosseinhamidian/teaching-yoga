import { NextResponse } from 'next/server';

import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';
import prismadb from '@/libs/prismadb';

export async function GET() {
  try {
    const comments = await prismadb.comment.findMany({
      where: {
        status: 'APPROVED',
        showOnHome: true,
        parentId: null,
        courseId: {
          not: null,
        },
      },

      orderBy: [
        {
          homeOrder: 'asc',
        },
        {
          createAt: 'desc',
        },
      ],

      take: 12,

      select: {
        id: true,
        content: true,
        homeOrder: true,
        createAt: true,

        user: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            avatar: true,
          },
        },

        course: {
          select: {
            id: true,
            title: true,
            shortAddress: true,
          },
        },
      },
    });

    const normalizedComments = comments.map((comment) => {
      const fullName = [comment.user?.firstname, comment.user?.lastname]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        id: comment.id,
        content: comment.content,
        homeOrder: comment.homeOrder,
        createAt: comment.createAt,

        user: {
          id: comment.user?.id,
          name: fullName || comment.user?.username || 'هنرجوی سامانه یوگا',
          username: comment.user?.username || null,
          avatar: comment.user?.avatar
            ? toAbsoluteMediaUrl(comment.user.avatar)
            : null,
        },

        course: comment.course
          ? {
              id: comment.course.id,
              title: comment.course.title,
              shortAddress: comment.course.shortAddress,
            }
          : null,
      };
    });

    return NextResponse.json(
      {
        comments: normalizedComments,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[HOME_COMMENTS_GET_ERROR]', error);

    return NextResponse.json(
      {
        error: 'دریافت نظرات هنرجوها انجام نشد',
      },
      {
        status: 500,
      }
    );
  }
}
