import 'server-only';

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';

const DEFAULT_ALLOWED_ROLES = new Set(['ADMIN', 'MANAGER']);

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

const normalizeAllowedRoles = (roles) => {
  if (roles instanceof Set) {
    return new Set([...roles].map((role) => String(role).trim().toUpperCase()));
  }

  if (Array.isArray(roles)) {
    return new Set(roles.map((role) => String(role).trim().toUpperCase()));
  }

  return DEFAULT_ALLOWED_ROLES;
};

/*
 * نقش داخل JWT را مبنای نهایی قرار نمی‌دهیم.
 * کاربر و Role فعلی او از دیتابیس خوانده می‌شود.
 *
 * در نتیجه:
 * - Role قدیمی داخل Token معتبر تلقی نمی‌شود.
 * - کاربر حذف‌شده دسترسی ندارد.
 * - تغییر Role در دیتابیس فوراً روی API اعمال می‌شود.
 */
export async function requireAdminApi({ roles = DEFAULT_ALLOWED_ROLES } = {}) {
  let tokenUser = null;

  try {
    tokenUser = await getAuthUser();
  } catch (error) {
    logError({
      log: getRequestLogger({
        component: 'admin-api-auth',
      }),

      error,

      message: 'Admin API authentication token could not be read',

      data: {
        event: 'admin_api_token_read_failed',
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
      phone: true,
      email: true,
      role: true,
    },
  });

  if (!dbUser) {
    return {
      ok: false,

      response: createErrorResponse('حساب کاربری معتبر نیست.', 401),
    };
  }

  const normalizedRole = String(dbUser.role || '')
    .trim()
    .toUpperCase();

  const allowedRoles = normalizeAllowedRoles(roles);

  if (!allowedRoles.has(normalizedRole)) {
    return {
      ok: false,

      response: createErrorResponse(
        'شما مجوز انجام این عملیات را ندارید.',
        403
      ),
    };
  }

  return {
    ok: true,

    user: {
      ...dbUser,
      role: normalizedRole,
    },
  };
}

export default requireAdminApi;
