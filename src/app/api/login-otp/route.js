import { NextResponse } from 'next/server';

import { attachAuthCookie } from '@/server/auth/auth-session';

import {
  completeOtpAuthentication,
  getAuthSubjectId,
  normalizeIranianPhone,
  OtpAuthError,
} from '@/server/auth/otp';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'login-otp',
  });

  try {
    const body = await request.json();

    const normalizedPhone = normalizeIranianPhone(body?.phone);

    log = log.child({
      subjectId: getAuthSubjectId(normalizedPhone),

      challengeId:
        typeof body?.challengeId === 'string' ? body.challengeId : null,
    });

    const result = await completeOtpAuthentication({
      phone: normalizedPhone,

      code: body?.code,

      challengeId: body?.challengeId,

      username: body?.username,
    });

    const response = NextResponse.json(
      {
        success: true,

        message: result.created
          ? 'ثبت‌نام و ورود با موفقیت انجام شد.'
          : 'ورود با موفقیت انجام شد.',

        created: result.created,
      },
      {
        status: result.created ? 201 : 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );

    attachAuthCookie(response, result.user);

    log.info(
      {
        event: 'otp_authentication_succeeded',

        userId: result.user.id,

        role: result.user.role,

        userCreated: result.created,
      },

      'OTP authentication succeeded'
    );

    return response;
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
          event: 'otp_authentication_rejected',

          reasonCode: error.code,

          status: error.status,
        },

        'OTP authentication was rejected'
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

      message: 'OTP authentication failed',

      data: {
        event: 'otp_authentication_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,

        error: 'خطا در ورود کاربر.',
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
  route: '/api/login-otp',

  component: 'login-otp-api',
});
