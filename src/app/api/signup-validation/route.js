import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import {
  getAuthSubjectId,
  normalizeIranianPhone,
  normalizeOtpUsername,
  OtpAuthError,
} from '@/server/auth/otp';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'signup-validation',
  });

  try {
    const body = await request.json();

    const phone = normalizeIranianPhone(body?.phone);

    const username = normalizeOtpUsername(body?.username);

    if (!username) {
      throw new OtpAuthError('نام کاربری ارسال نشده است.', {
        status: 400,
        code: 'USERNAME_REQUIRED',
      });
    }

    log = log.child({
      subjectId: getAuthSubjectId(phone),
    });

    const [usernameExists, phoneExists] = await Promise.all([
      prismadb.user.findUnique({
        where: {
          username,
        },

        select: {
          id: true,
        },
      }),

      prismadb.user.findUnique({
        where: {
          phone,
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (usernameExists) {
      log.info(
        {
          event: 'signup_prevalidation_rejected',

          reasonCode: 'USERNAME_EXISTS',
        },

        'Signup prevalidation was rejected'
      );

      return NextResponse.json(
        {
          success: false,

          error: 'این نام کاربری قبلاً استفاده شده است.',
        },
        {
          status: 409,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    if (phoneExists) {
      log.info(
        {
          event: 'signup_prevalidation_rejected',

          reasonCode: 'PHONE_EXISTS',
        },

        'Signup prevalidation was rejected'
      );

      return NextResponse.json(
        {
          success: false,

          error: 'این شماره موبایل قبلاً استفاده شده است.',
        },
        {
          status: 409,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    log.info(
      {
        event: 'signup_prevalidation_succeeded',
      },

      'Signup prevalidation succeeded'
    );

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,

          error: 'بدنه درخواست معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    if (error instanceof OtpAuthError) {
      log.warn(
        {
          event: 'signup_prevalidation_rejected',

          status: error.status,

          reasonCode: error.code,
        },

        'Signup prevalidation was rejected'
      );

      return NextResponse.json(
        {
          success: false,

          error: error.message,
        },
        {
          status: error.status,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    logError({
      log,
      error,

      message: 'Signup prevalidation failed',

      data: {
        event: 'signup_prevalidation_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,

        error: 'مشکل در پردازش درخواست.',
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

export const POST = withApiLogging(handlePost, {
  route: '/api/signup-validation',

  component: 'signup-validation-api',
});
