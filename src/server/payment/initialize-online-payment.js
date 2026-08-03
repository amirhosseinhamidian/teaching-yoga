/* eslint-disable no-undef */
import 'server-only';

import prismadb from '@/libs/prismadb';

import {
  buildZarinpalRedirectUrl,
  createZarinpalPayment,
} from './zarinpal-client';

import { logError } from '@/server/logger';
import { refreshDiscountReservationsForPayment } from '@/server/discount/discount-reservation';

const DEFAULT_REUSE_SECONDS = 15 * 60;

export class PaymentInitializationError extends Error {
  constructor(
    message,
    { status = 400, code = 'PAYMENT_INITIALIZATION_ERROR' } = {}
  ) {
    super(message);

    this.name = 'PaymentInitializationError';
    this.status = status;
    this.code = code;
  }
}

const getReuseWindowMs = () => {
  const configured = Number(process.env.PAYMENT_PENDING_REUSE_SECONDS);

  const seconds =
    Number.isSafeInteger(configured) && configured > 0
      ? configured
      : DEFAULT_REUSE_SECONDS;

  return seconds * 1000;
};

const isSameNullableId = (first, second) => {
  return (first ?? null) === (second ?? null);
};

const buildPaymentSelectors = ({ cartId, shopOrderId }) => {
  const selectors = [];

  if (cartId) {
    selectors.push({
      cartId,
    });
  }

  if (shopOrderId) {
    selectors.push({
      shopOrderId,
    });
  }

  return selectors;
};

export const initializeOnlinePayment = async ({
  userId,
  cartId = null,
  shopOrderId = null,
  amountInRial,
  kind,
  description,
  log,
}) => {
  const selectors = buildPaymentSelectors({
    cartId,
    shopOrderId,
  });

  if (!selectors.length) {
    throw new PaymentInitializationError(
      'Payment must be connected to a cart or order.',
      {
        status: 400,
        code: 'PAYMENT_TARGET_REQUIRED',
      }
    );
  }

  const matchingPayments = await prismadb.payment.findMany({
    where: {
      userId,

      OR: selectors,
    },

    orderBy: {
      updatedAt: 'desc',
    },

    take: 3,
  });

  const successfulPayment = matchingPayments.find(
    (payment) => payment.status === 'SUCCESSFUL'
  );

  if (successfulPayment) {
    throw new PaymentInitializationError(
      'پرداخت این سفارش قبلاً انجام شده است.',
      {
        status: 409,
        code: 'PAYMENT_ALREADY_SUCCESSFUL',
      }
    );
  }

  const distinctPaymentIds = new Set(
    matchingPayments.map((payment) => payment.id)
  );

  if (distinctPaymentIds.size > 1) {
    throw new PaymentInitializationError(
      'سبدهای انتخاب‌شده به درخواست‌های پرداخت متفاوت متصل هستند.',
      {
        status: 409,
        code: 'PAYMENT_TARGET_CONFLICT',
      }
    );
  }

  const existingPayment = matchingPayments[0] || null;

  const canReuseExistingAuthority = Boolean(
    existingPayment &&
    existingPayment.status === 'PENDING' &&
    existingPayment.authority &&
    existingPayment.amount === amountInRial &&
    existingPayment.kind === kind &&
    isSameNullableId(existingPayment.cartId, cartId) &&
    isSameNullableId(existingPayment.shopOrderId, shopOrderId) &&
    Date.now() - existingPayment.updatedAt.getTime() < getReuseWindowMs()
  );

  if (canReuseExistingAuthority) {
    await refreshDiscountReservationsForPayment({
      userId,
      cartId,
      shopOrderId,
    });

    log.info(
      {
        event: 'payment_gateway_redirect_reused',

        paymentId: existingPayment.id,
        userId,
        kind,
      },
      'Existing payment gateway redirect reused'
    );

    return {
      paymentId: existingPayment.id,

      redirectUrl: buildZarinpalRedirectUrl(existingPayment.authority),

      reused: true,
    };
  }

  let payment;

  if (existingPayment) {
    payment = await prismadb.payment.update({
      where: {
        id: existingPayment.id,
      },

      data: {
        amount: amountInRial,

        status: 'PENDING',
        method: 'ONLINE',

        authority: null,
        transactionId: null,

        kind,

        cartId,
        shopOrderId,
      },
    });
  } else {
    payment = await prismadb.payment.create({
      data: {
        userId,

        amount: amountInRial,

        status: 'PENDING',
        method: 'ONLINE',

        authority: null,

        kind,

        cartId,
        shopOrderId,
      },
    });
  }

  const discountReservation = await refreshDiscountReservationsForPayment({
    userId,
    cartId,
    shopOrderId,
  });

  const paymentLog = log.child({
    paymentId: payment.id,
    userId,
    kind,
    cartId,
    shopOrderId,
  });

  paymentLog.info(
    {
      event: 'payment_gateway_request_started',

      discountReservationCount: discountReservation.refreshedCount,
    },
    'Payment gateway request started'
  );

  try {
    const gatewayPayment = await createZarinpalPayment({
      amountInRial,
      description,
    });

    await prismadb.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        authority: gatewayPayment.authority,
        status: 'PENDING',
      },
    });

    paymentLog.info(
      {
        event: 'payment_gateway_request_succeeded',

        gatewayCode: gatewayPayment.gatewayCode,
      },
      'Payment gateway request succeeded'
    );

    return {
      paymentId: payment.id,
      redirectUrl: gatewayPayment.redirectUrl,
      reused: false,
    };
  } catch (error) {
    try {
      await prismadb.payment.updateMany({
        where: {
          id: payment.id,

          status: {
            not: 'SUCCESSFUL',
          },
        },

        data: {
          status: 'FAILED',
          authority: null,
        },
      });
    } catch (statusUpdateError) {
      logError({
        log: paymentLog,
        error: statusUpdateError,

        message: 'Failed to mark payment initialization as failed',

        data: {
          event: 'payment_initialization_status_update_failed',
        },
      });
    }

    throw error;
  }
};
