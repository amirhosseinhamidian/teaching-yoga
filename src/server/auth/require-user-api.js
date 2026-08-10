import 'server-only';

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';

const createErrorResponse = (error, status) => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
};

/*
 * احراز هویت کاربر عادی برای APIها
 *
 * تفاوت با requireAdminApi:
 * - فقط لاگین بودن کاربر بررسی می‌شود.
 * - هیچ محدودیت Role نداریم.
 * - اطلاعات کاربر دوباره از دیتابیس خوانده می‌شود.
 *
 * بنابراین:
 * - کاربر حذف‌شده دسترسی ندارد.
 * - به اطلاعات قدیمی JWT اعتماد کامل نمی‌کنیم.
 */
export async function requireUserApi() {
  let tokenUser = null;

  try {
    tokenUser = await getAuthUser();
  } catch (error) {
    logError({
      log: getRequestLogger({
        component: 'user-api-auth',
      }),

      error,

      message: 'User API authentication token could not be read',

      data: {
        event: 'user_api_token_read_failed',
      },
    });
  }

  if (!tokenUser?.id) {
    return {
      ok: false,

      response: createErrorResponse(
        'برای انجام این عملیات باید وارد حساب کاربری شوید.',
        401
      ),
    };
  }

  const dbUser = await prismadb.user.findUnique({
    where: {
      id: tokenUser.id,
    },

    select: {
      id: true,
      username: true,
      firstname: true,
      lastname: true,
      phone: true,
      email: true,
      avatar: true,
      role: true,
    },
  });

  if (!dbUser) {
    return {
      ok: false,

      response: createErrorResponse('حساب کاربری معتبر نیست.', 401),
    };
  }

  return {
    ok: true,
    user: {
      ...dbUser,

      role: String(dbUser.role || '')
        .trim()
        .toUpperCase(),
    },
  };
}

export default requireUserApi;
