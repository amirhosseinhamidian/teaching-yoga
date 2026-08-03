import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { getAuthUser } from '@/utils/getAuthUser';

import {
  initializeOnlinePayment,
  PaymentInitializationError,
} from '@/server/payment/initialize-online-payment';

import { PaymentGatewayError } from '@/server/payment/zarinpal-client';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';
import { DiscountReservationError } from '@/server/discount/discount-reservation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const normalizePlanId = (value) => {
  const planId = Number(value);

  if (!Number.isInteger(planId) || planId <= 0) {
    return null;
  }

  return planId;
};

const getOrCreateSubscriptionCart = async ({
  userId,
  plan,
  basePrice,
  discount,
  finalAmountToman,
}) => {
  const reusableCart = await prismadb.cart.findFirst({
    where: {
      userId,
      status: 'PENDING',

      cartCourses: {
        none: {},
      },

      cartTerms: {
        none: {},
      },

      cartSubscriptions: {
        some: {
          subscriptionPlanId: plan.id,
        },

        every: {
          subscriptionPlanId: plan.id,
        },
      },
    },

    include: {
      payment: true,
    },

    orderBy: {
      updatedAt: 'desc',
    },
  });

  if (reusableCart && reusableCart.payment?.status !== 'SUCCESSFUL') {
    await prismadb.$transaction([
      prismadb.cart.update({
        where: {
          id: reusableCart.id,
        },

        data: {
          totalPrice: finalAmountToman,
          totalDiscount: discount,
          status: 'PENDING',
        },
      }),

      prismadb.cartSubscription.upsert({
        where: {
          cartId_subscriptionPlanId: {
            cartId: reusableCart.id,
            subscriptionPlanId: plan.id,
          },
        },

        update: {
          price: basePrice,
          discount,
        },

        create: {
          cartId: reusableCart.id,
          subscriptionPlanId: plan.id,
          price: basePrice,
          discount,
        },
      }),
    ]);

    return reusableCart.id;
  }

  const cart = await prismadb.cart.create({
    data: {
      userId,
      status: 'PENDING',

      totalPrice: finalAmountToman,
      totalDiscount: discount,

      cartSubscriptions: {
        create: {
          subscriptionPlanId: plan.id,
          price: basePrice,
          discount,
        },
      },
    },

    select: {
      id: true,
    },
  });

  return cart.id;
};

const handlePost = async (request) => {
  let log = getRequestLogger({
    component: 'subscription-checkout',
  });

  let userId = null;
  let planId = null;

  try {
    const authUser = getAuthUser();

    if (!authUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'برای خرید اشتراک ابتدا وارد شوید.',
        },
        {
          status: 401,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    userId = authUser.id;

    log = log.child({
      userId,
    });

    const body = await request.json();

    planId = normalizePlanId(body?.planId);

    if (!planId) {
      return NextResponse.json(
        {
          success: false,
          error: 'شناسه پلن معتبر نیست.',
        },
        {
          status: 400,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    log = log.child({
      planId,
    });

    const plan = await prismadb.subscriptionPlan.findUnique({
      where: {
        id: planId,
      },

      select: {
        id: true,
        name: true,
        price: true,
        discountAmount: true,
        isActive: true,
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'پلن اشتراک یافت نشد یا غیرفعال است.',
        },
        {
          status: 404,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const basePrice = Math.max(0, Number(plan.price || 0));

    const discount = Math.max(0, Number(plan.discountAmount || 0));

    const finalAmountToman = Math.max(basePrice - discount, 0);

    if (!Number.isSafeInteger(finalAmountToman) || finalAmountToman <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'مبلغ نهایی اشتراک معتبر نیست.',
        },
        {
          status: 400,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const amountInRial = finalAmountToman * 10;

    const cartId = await getOrCreateSubscriptionCart({
      userId,
      plan,
      basePrice,
      discount,
      finalAmountToman,
    });

    const initializedPayment = await initializeOnlinePayment({
      userId,
      cartId,

      amountInRial,

      kind: 'DIGITAL',

      description: `خرید اشتراک ${plan.id}`,

      log,
    });

    log.info(
      {
        event: 'subscription_payment_initialized',

        paymentId: initializedPayment.paymentId,

        cartId,
        planId,

        gatewayRedirectReused: initializedPayment.reused,
      },
      'Subscription payment initialized'
    );

    return NextResponse.json(
      {
        success: true,

        redirectUrl: initializedPayment.redirectUrl,

        paymentId: initializedPayment.paymentId,
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

    if (error instanceof DiscountReservationError) {
      log.warn(
        {
          event: 'checkout_discount_reservation_rejected',

          userId,

          status: error.status,
          reasonCode: error.code,
          discountCodeId: error.discountCodeId,
        },
        'Checkout discount reservation was rejected'
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

    if (error instanceof PaymentInitializationError) {
      log.warn(
        {
          event: 'subscription_payment_rejected',

          userId,
          planId,

          status: error.status,
          reasonCode: error.code,
        },
        'Subscription payment initialization was rejected'
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

    if (error instanceof PaymentGatewayError) {
      logError({
        log,
        error,

        message: 'Subscription payment gateway request failed',

        data: {
          event: 'subscription_payment_gateway_failed',

          userId,
          planId,

          operation: error.operation,
          gatewayCode: error.gatewayCode,
          gatewayHttpStatus: error.httpStatus,
          retryable: error.retryable,
        },
      });

      return NextResponse.json(
        {
          success: false,

          error:
            'اتصال به درگاه پرداخت با خطا مواجه شد. کمی بعد دوباره تلاش کنید.',
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

      message: 'Subscription checkout failed',

      data: {
        event: 'subscription_checkout_failed',

        userId,
        planId,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطای داخلی سرور.',
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
  route: '/api/subscription/checkout',
  component: 'subscription-checkout-api',
});
