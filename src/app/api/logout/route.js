import { NextResponse } from 'next/server';

import { clearAuthCookie } from '@/server/auth/auth-session';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getAuthUser } from '@/utils/getAuthUser';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const handlePost = async () => {
  let log = getRequestLogger({
    component: 'logout',
  });

  try {
    const tokenUser = await getAuthUser();

    if (tokenUser?.id) {
      log = log.child({
        userId: tokenUser.id,
      });
    }

    const response = NextResponse.json(
      {
        success: true,

        message: 'خروج موفقیت‌آمیز.',
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );

    clearAuthCookie(response);

    log.info(
      {
        event: 'auth_session_logged_out',

        authenticated: Boolean(tokenUser?.id),
      },

      'Authentication session logged out'
    );

    return response;
  } catch (error) {
    logError({
      log,
      error,

      message: 'Authentication logout failed',

      data: {
        event: 'auth_logout_failed',
      },
    });

    /*
     * حتی اگر خواندن Session خطا دهد،
     * کوکی مرورگر حذف می‌شود.
     */
    const response = NextResponse.json(
      {
        success: true,

        message: 'خروج انجام شد.',
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );

    clearAuthCookie(response);

    return response;
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/logout',

  component: 'logout-api',
});
