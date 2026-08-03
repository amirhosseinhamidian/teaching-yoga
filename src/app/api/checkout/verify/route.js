import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import {
  finalizeVerifiedPayment,
  PaymentFinalizationError,
} from '@/server/payment/finalize-verified-payment';

import {
  PaymentGatewayError,
  verifyZarinpalPayment,
} from '@/server/payment/zarinpal-client';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const normalizeCallbackStatus = (value) => {
  return String(value || '')
    .trim()
    .toUpperCase();
};

const getApplicationBaseUrl = (request) => {
  const configured = String(process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();

  if (configured) {
    return new URL(configured);
  }

  return new URL(request.nextUrl.origin);
};

const createCompletePaymentUrl = (request, { token, status }) => {
  const url = new URL('/complete-payment', getApplicationBaseUrl(request));

  url.searchParams.set('token', String(token));

  url.searchParams.set('status', status);

  return url;
};

const createSuccessRedirect = (request, paymentId) => {
  return NextResponse.redirect(
    createCompletePaymentUrl(request, {
      token: paymentId,

      status: 'OK',
    })
  );
};

const createFailureRedirect = (request, reason) => {
  return NextResponse.redirect(
    createCompletePaymentUrl(request, {
      token: reason,

      status: 'NOK',
    })
  );
};

const markPaymentFailedSafely = async ({ paymentId, log, reasonCode }) => {
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return;
  }

  try {
    await prismadb.payment.updateMany({
      where: {
        id: paymentId,

        status: {
          not: 'SUCCESSFUL',
        },
      },

      data: {
        status: 'FAILED',
      },
    });

    log.info(
      {
        event: 'payment_marked_failed',

        paymentId,
        reasonCode,
      },
      'Payment was marked as failed'
    );
  } catch (error) {
    logError({
      log,
      error,

      message: 'Failed to update payment failure status',

      data: {
        event: 'payment_failure_status_update_failed',

        paymentId,
        reasonCode,
      },
    });
  }
};

const handleGet = async (request) => {
  let log = getRequestLogger({
    component: 'payment-verify',
  });

  let paymentId = null;

  const authority = request.nextUrl.searchParams.get('Authority')?.trim();

  const callbackStatus = normalizeCallbackStatus(
    request.nextUrl.searchParams.get('Status')
  );

  if (!authority) {
    log.warn(
      {
        event: 'payment_callback_rejected',

        reasonCode: 'AUTHORITY_MISSING',
      },
      'Payment callback did not contain authority'
    );

    return createFailureRedirect(request, 'error-invalid-callback');
  }

  try {
    /*
     * Authority برای Lookup استفاده می‌شود،
     * اما هرگز در Logger قرار نمی‌گیرد.
     */
    const payment = await prismadb.payment.findUnique({
      where: {
        authority,
      },

      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        kind: true,
      },
    });

    if (!payment) {
      log.warn(
        {
          event: 'payment_callback_rejected',

          reasonCode: 'PAYMENT_NOT_FOUND',

          callbackStatus,
        },
        'Payment callback did not match a payment'
      );

      return createFailureRedirect(request, 'error-payment-not-found');
    }

    paymentId = payment.id;

    log = log.child({
      paymentId: payment.id,

      userId: payment.userId,

      paymentKind: payment.kind,
    });

    log.info(
      {
        event: 'payment_callback_received',

        callbackStatus,
      },
      'Payment callback received'
    );

    /*
     * اگر قبلاً Finalize شده باشد، نتیجه Callback
     * تکراری یا حتی Status اشتباه، وضعیت را خراب نمی‌کند.
     */
    if (payment.status === 'SUCCESSFUL') {
      log.info(
        {
          event: 'payment_callback_already_finalized',
        },
        'Payment callback was already finalized'
      );

      return createSuccessRedirect(request, payment.id);
    }

    /*
     * فقط Status=OK مجاز به فراخوانی Verify است.
     */
    if (callbackStatus !== 'OK') {
      await markPaymentFailedSafely({
        paymentId: payment.id,

        log,

        reasonCode: 'CALLBACK_NOT_OK',
      });

      log.info(
        {
          event: 'payment_callback_cancelled',

          callbackStatus: callbackStatus || 'MISSING',
        },
        'Payment was cancelled or rejected before verification'
      );

      return createFailureRedirect(request, 'error-payment-cancelled');
    }

    log.info(
      {
        event: 'payment_gateway_verification_started',
      },
      'Payment gateway verification started'
    );

    let verification;

    try {
      verification = await verifyZarinpalPayment({
        amountInRial: payment.amount,

        authority,
      });
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        /*
         * Timeout و Network Error قطعاً به معنی
         * ناموفق بودن پرداخت بانکی نیستند.
         * در این حالت Payment در وضعیت فعلی می‌ماند.
         */
        if (!error.retryable) {
          await markPaymentFailedSafely({
            paymentId: payment.id,

            log,

            reasonCode: error.code,
          });
        }

        logError({
          log,
          error,

          message: 'Payment gateway verification failed',

          data: {
            event: 'payment_gateway_verification_failed',

            paymentId: payment.id,

            operation: error.operation,

            gatewayCode: error.gatewayCode,

            gatewayHttpStatus: error.httpStatus,

            retryable: error.retryable,
          },
        });

        return createFailureRedirect(
          request,
          error.retryable
            ? 'error-verification-temporary'
            : 'error-payment-failed'
        );
      }

      throw error;
    }

    log.info(
      {
        event: 'payment_gateway_verification_succeeded',

        gatewayCode: verification.gatewayCode,
      },
      'Payment gateway verification succeeded'
    );

    let finalization;

    try {
      finalization = await finalizeVerifiedPayment({
        paymentId: payment.id,

        gatewayCode: verification.gatewayCode,

        referenceId: verification.referenceId,
      });
    } catch (error) {
      if (error instanceof PaymentFinalizationError) {
        /*
         * Verify بانکی موفق شده ولی Fulfillment
         * دیتابیس شکست خورده است.
         *
         * Payment را FAILED نمی‌کنیم، چون ممکن است
         * وجه واقعاً دریافت شده باشد. Transaction
         * دیتابیس Rollback شده و Callback قابل Retry است.
         */
        logError({
          log,
          error,

          message: 'Verified payment fulfillment failed',

          data: {
            event: 'verified_payment_fulfillment_failed',

            paymentId: payment.id,

            reasonCode: error.code,

            productId: error.productId,
          },
        });

        return createFailureRedirect(request, 'error-fulfillment-pending');
      }

      throw error;
    }

    log.info(
      {
        event: 'payment_finalization_succeeded',

        alreadyFinalized: finalization.alreadyFinalized,

        courseCount: finalization.courseCount,

        termCount: finalization.termCount,

        subscriptionCount: finalization.subscriptionCount,

        productLineCount: finalization.productLineCount,

        stockChanged: finalization.stockChanged,

        discountUsageCount: finalization.discountUsageCount,

        legacyDiscountUsageCount: finalization.legacyDiscountUsageCount,
      },
      'Payment was finalized successfully'
    );

    return createSuccessRedirect(request, payment.id);
  } catch (error) {
    logError({
      log,
      error,

      message: 'Payment verification callback failed',

      data: {
        event: 'payment_verification_callback_failed',

        paymentId,
      },
    });

    /*
     * خطای داخلی بعد از Callback لزوماً به معنی
     * شکست پرداخت بانکی نیست؛ Payment را FAILED نمی‌کنیم.
     */
    return createFailureRedirect(request, 'error-something-went-wrong');
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/checkout/verify',

  component: 'payment-verify-api',
});
