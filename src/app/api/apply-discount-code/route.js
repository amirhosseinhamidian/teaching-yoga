import { NextResponse } from 'next/server';

import { getAuthUser } from '@/utils/getAuthUser';

import {
  DiscountReservationError,
  releaseExpiredDiscountReservations,
  reserveDiscountForUser,
} from '@/server/discount/discount-reservation';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Vary: 'Cookie',
};

const jsonResponse = (body, status = 200) => {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
};

const handleReservationError = ({ error, log, event }) => {
  log.warn(
    {
      event,
      reasonCode: error.code,
      status: error.status,
      discountCodeId: error.discountCodeId,
    },
    'Discount reservation request was rejected'
  );

  return jsonResponse(
    {
      success: false,
      message: error.message,
    },
    error.status
  );
};

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'discount-reservation',
  });

  try {
    const authUser = await getAuthUser();

    if (!authUser?.id) {
      return jsonResponse(
        {
          success: false,
          message: 'ابتدا وارد حساب کاربری شوید.',
        },
        401
      );
    }

    log = log.child({
      userId: authUser.id,
    });

    const body = await request.json();

    const result = await reserveDiscountForUser({
      userId: authUser.id,
      code: body?.code,
    });

    log.info(
      {
        event: 'discount_reservation_created',

        hasCourseCart: Boolean(result.cart?.id),
        hasShopCart: Boolean(result.shop?.id),

        courseDiscountAmount: Number(result.cart?.discountCodeAmount || 0),

        shopDiscountAmount: Number(result.shop?.discountAmount || 0),
      },
      'Discount reservation created'
    );

    return jsonResponse(
      {
        success: true,
        message: 'کد تخفیف با موفقیت رزرو و اعمال شد.',
        cart: result.cart,
        shop: result.shop,
      },
      200
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse(
        {
          success: false,
          message: 'بدنه درخواست معتبر نیست.',
        },
        400
      );
    }

    if (error instanceof DiscountReservationError) {
      return handleReservationError({
        error,
        log,
        event: 'discount_reservation_rejected',
      });
    }

    logError({
      log,
      error,

      message: 'Discount reservation failed',

      data: {
        event: 'discount_reservation_failed',
      },
    });

    return jsonResponse(
      {
        success: false,
        message: 'خطای داخلی سرور.',
      },
      500
    );
  }
};

const handlePatch = async () => {
  let log = getRequestLogger({
    component: 'discount-reservation-cleanup',
  });

  try {
    const authUser = await getAuthUser();

    if (!authUser?.id) {
      return jsonResponse(
        {
          success: false,
          message: 'ابتدا وارد حساب کاربری شوید.',
        },
        401
      );
    }

    log = log.child({
      userId: authUser.id,
    });

    const result = await releaseExpiredDiscountReservations({
      userId: authUser.id,
    });

    log.info(
      {
        event: 'expired_discount_reservations_checked',
        clearedCount: result.clearedCount,
      },
      'Expired discount reservations checked'
    );

    return jsonResponse(
      {
        success: true,

        message: result.cleared
          ? 'رزرو منقضی‌شده کد تخفیف آزاد شد.'
          : 'رزرو کد تخفیف همچنان معتبر است.',

        cart: result.cart,
        shop: result.shop,
      },
      200
    );
  } catch (error) {
    if (error instanceof DiscountReservationError) {
      return handleReservationError({
        error,
        log,
        event: 'discount_reservation_cleanup_rejected',
      });
    }

    logError({
      log,
      error,

      message: 'Expired discount reservation cleanup failed',

      data: {
        event: 'discount_reservation_cleanup_failed',
      },
    });

    return jsonResponse(
      {
        success: false,
        message: 'خطای داخلی سرور.',
      },
      500
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/apply-discount-code',
  component: 'discount-reservation-api',
});

export const PATCH = withApiLogging(handlePatch, {
  route: '/api/apply-discount-code',
  component: 'discount-reservation-api',
});
