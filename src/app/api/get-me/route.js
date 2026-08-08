import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { clearAuthCookie } from '@/server/auth/auth-session';
import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';
import { withApiLogging } from '@/server/logger/with-api-logging';
import { getAuthUser } from '@/utils/getAuthUser';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const createUnauthorizedResponse = () => {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );

  clearAuthCookie(response);

  return response;
};

const handleGet = async () => {
  let log = getRequestLogger({
    component: 'get-me',
  });

  try {
    const tokenUser = await getAuthUser();

    if (!tokenUser?.id) {
      log.debug(
        {
          event: 'auth_profile_unauthorized',
        },
        'Auth profile request was unauthorized'
      );

      return createUnauthorizedResponse();
    }

    log = log.child({
      userId: tokenUser.id,
    });

    const rawUser = await prismadb.user.findUnique({
      where: {
        id: tokenUser.id,
      },
      include: {
        questions: true,
        comments: true,
        courses: true,
        carts: {
          include: {
            cartCourses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    cover: true,
                    shortAddress: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!rawUser) {
      log.warn(
        {
          event: 'auth_profile_user_missing',
        },
        'Authenticated user no longer exists'
      );

      return createUnauthorizedResponse();
    }

    const user = {
      ...rawUser,
      avatar: toAbsoluteMediaUrl(rawUser.avatar),

      courses: rawUser.courses.map((course) => ({
        ...course,
        cover: toAbsoluteMediaUrl(course.cover),
      })),

      carts: rawUser.carts.map((cart) => {
        const courses = cart.cartCourses.map((item) => ({
          ...item.course,
          cover: toAbsoluteMediaUrl(item.course.cover),
        }));

        const uniqueCourses = Array.from(
          new Map(courses.map((course) => [course.id, course])).values()
        );

        return {
          ...cart,

          cartCourses: cart.cartCourses.map((item) => ({
            ...item,
            course: {
              ...item.course,
              cover: toAbsoluteMediaUrl(item.course.cover),
            },
          })),

          uniqueCourses,
        };
      }),
    };

    log.info(
      {
        event: 'auth_profile_loaded',
        role: rawUser.role,
        cartCount: rawUser.carts.length,
      },
      'Authenticated user profile loaded'
    );

    return NextResponse.json(
      {
        success: true,
        user,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    logError({
      log,
      error,
      message: 'Authenticated user profile request failed',
      data: {
        event: 'auth_profile_load_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/get-me',
  component: 'get-me-api',
  logSuccess: false,
});
