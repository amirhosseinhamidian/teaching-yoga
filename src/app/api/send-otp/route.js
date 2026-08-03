import { NextResponse } from 'next/server';

import {
  createOtpChallenge,
  getAuthSubjectId,
  invalidateOtpChallenge,
  OtpAuthError,
} from '@/server/auth/otp';

import {
  OtpDeliveryError,
  sendOtpWithKavenegar,
} from '@/server/auth/kavenegar-otp';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'send-otp',
  });

  let challengeId = null;

  try {
    const body = await request.json();

    const challenge = await createOtpChallenge(body?.phone);

    challengeId = challenge.challengeId;

    log = log.child({
      subjectId: getAuthSubjectId(challenge.phone),
    });

    log.info(
      {
        event: 'otp_delivery_started',

        challengeId,

        expiresInSeconds: challenge.expiresInSeconds,
      },

      'OTP delivery started'
    );

    try {
      await sendOtpWithKavenegar({
        phone: challenge.phone,

        code: challenge.code,
      });
    } catch (error) {
      await invalidateOtpChallenge(challengeId).catch((invalidateError) => {
        logError({
          log,

          error: invalidateError,

          message: 'Failed to invalidate undelivered OTP challenge',

          data: {
            event: 'otp_delivery_invalidation_failed',

            challengeId,
          },
        });
      });

      throw error;
    }

    log.info(
      {
        event: 'otp_delivered',

        challengeId,

        expiresInSeconds: challenge.expiresInSeconds,
      },

      'OTP delivered successfully'
    );

    /*
     * کد OTP در پاسخ API قرار نمی‌گیرد.
     * challengeId یک شناسه تصادفی و غیرمحرمانه است.
     */
    return NextResponse.json(
      {
        success: true,

        challengeId,

        expiresInSeconds: challenge.expiresInSeconds,

        resendAfterSeconds: challenge.resendAfterSeconds,

        message: 'کد تأیید ارسال شد.',
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
          event: 'otp_delivery_rejected',

          reasonCode: error.code,

          status: error.status,

          retryAfterSeconds: error.retryAfterSeconds,
        },

        'OTP delivery was rejected'
      );

      const headers = {
        'Cache-Control': 'no-store',
      };

      if (error.retryAfterSeconds) {
        headers['Retry-After'] = String(error.retryAfterSeconds);
      }

      return NextResponse.json(
        {
          success: false,

          error: error.message,

          retryAfterSeconds: error.retryAfterSeconds,
        },
        {
          status: error.status,

          headers,
        }
      );
    }

    if (error instanceof OtpDeliveryError) {
      logError({
        log,
        error,

        message: 'OTP provider delivery failed',

        data: {
          event: 'otp_provider_delivery_failed',

          challengeId,

          providerStatus: error.providerStatus,
        },
      });

      return NextResponse.json(
        {
          success: false,

          error: 'ارسال پیامک با خطا مواجه شد. کمی بعد دوباره تلاش کنید.',
        },
        {
          status: 502,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    logError({
      log,
      error,

      message: 'Send OTP request failed',

      data: {
        event: 'otp_delivery_failed',

        challengeId,
      },
    });

    return NextResponse.json(
      {
        success: false,

        error: 'خطا در پردازش درخواست ارسال کد.',
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
  route: '/api/send-otp',

  component: 'send-otp-api',
});
