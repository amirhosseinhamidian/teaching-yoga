import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { getAuthUser } from '@/utils/getAuthUser';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const RESPONSE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',

  Pragma: 'no-cache',

  Vary: 'Cookie',

  'X-Content-Type-Options': 'nosniff',
};

const jsonResponse = (body, status = 200) => {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
};

const normalizePaymentId = (value) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  /*
   * parseInt("12abc") برابر 12 می‌شود؛
   * به همین دلیل ابتدا کل رشته اعتبارسنجی می‌شود.
   */
  if (!/^\d+$/.test(rawValue)) {
    return null;
  }

  const paymentId = Number(rawValue);

  if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
    return null;
  }

  return paymentId;
};

const createPaymentDetailsDto = (payment) => {
  const cart = payment.cart
    ? {
        ...payment.cart,

        cartCourses:
          payment.cart.cartCourses?.map((item) => ({
            ...item,

            course: item.course
              ? {
                  ...item.course,

                  cover: toAbsoluteMediaUrl(item.course.cover),
                }
              : null,
          })) || [],

        cartSubscriptions: payment.cart.cartSubscriptions || [],
      }
    : null;

  const shopOrder = payment.shopOrder
    ? {
        ...payment.shopOrder,

        items:
          payment.shopOrder.items?.map((item) => ({
            ...item,

            coverImage: toAbsoluteMediaUrl(item.coverImage),
          })) || [],
      }
    : null;

  return {
    id: payment.id,

    transactionId:
      payment.transactionId === null || payment.transactionId === undefined
        ? null
        : String(payment.transactionId),

    amount: payment.amount,

    status: payment.status,

    method: payment.method,

    kind: payment.kind,

    createAt: payment.createAt,

    updatedAt: payment.updatedAt,

    cart,

    shopOrder,
  };
};

const handleGet = async (request) => {
  let log = getRequestLogger({
    component: 'payment-details',
  });

  let paymentId = null;

  try {
    const authUser = await getAuthUser();

    if (!authUser?.id) {
      log.debug(
        {
          event: 'payment_details_unauthorized',
        },
        'Payment details request was unauthorized'
      );

      return jsonResponse(
        {
          success: false,

          error: 'برای مشاهده نتیجه پرداخت باید وارد حساب کاربری شوید.',
        },
        401
      );
    }

    const token = request.nextUrl.searchParams.get('token');

    paymentId = normalizePaymentId(token);

    if (!paymentId) {
      return jsonResponse(
        {
          success: false,

          error: 'شناسه پرداخت معتبر نیست.',
        },
        400
      );
    }

    log = log.child({
      userId: authUser.id,

      paymentId,
    });

    /*
     * userId مستقیماً در Query اعمال شده است.
     *
     * بنابراین:
     * - کاربر نمی‌تواند Payment کاربر دیگر را بخواند.
     * - تفاوت بین «وجود ندارد» و «متعلق به فرد دیگری است»
     *   افشا نمی‌شود.
     */
    const payment = await prismadb.payment.findFirst({
      where: {
        id: paymentId,

        userId: authUser.id,
      },

      select: {
        id: true,
        amount: true,

        status: true,
        method: true,
        kind: true,

        transactionId: true,

        createAt: true,
        updatedAt: true,

        cart: {
          select: {
            id: true,

            cartCourses: {
              select: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    cover: true,

                    shortAddress: true,
                  },
                },
              },
            },

            cartSubscriptions: {
              select: {
                id: true,
                price: true,
                discount: true,

                subscriptionPlan: {
                  select: {
                    id: true,
                    name: true,

                    description: true,

                    durationInDays: true,

                    intervalLabel: true,

                    price: true,

                    discountAmount: true,

                    isActive: true,
                  },
                },
              },
            },
          },
        },

        shopOrder: {
          select: {
            id: true,

            status: true,
            paymentStatus: true,

            trackingCode: true,

            shippingTitle: true,

            shippingMethod: true,

            shippingCost: true,

            subtotal: true,

            discountAmount: true,

            payableOnline: true,

            payableCOD: true,

            createdAt: true,

            /*
             * اطلاعات ارسال فقط به صاحب Payment
             * برگردانده می‌شود.
             */
            fullName: true,
            phone: true,

            province: true,
            city: true,

            address1: true,
            postalCode: true,

            items: {
              select: {
                id: true,
                productId: true,
                qty: true,

                title: true,
                unitPrice: true,

                coverImage: true,

                slug: true,

                colorId: true,
                sizeId: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      log.warn(
        {
          event: 'payment_details_not_found',
        },
        'Payment details were not found for authenticated user'
      );

      return jsonResponse(
        {
          success: false,

          error: 'اطلاعات پرداخت یافت نشد.',
        },
        404
      );
    }

    /*
     * صفحه نتیجه موفق نباید اطلاعات Payment
     * نیمه‌کاره یا ناموفق را نمایش دهد.
     */
    if (payment.status !== 'SUCCESSFUL') {
      log.warn(
        {
          event: 'payment_details_not_finalized',

          paymentStatus: payment.status,
        },
        'Payment details were requested before finalization'
      );

      return jsonResponse(
        {
          success: false,

          error: 'پرداخت هنوز نهایی نشده است.',
        },
        409
      );
    }

    const dto = createPaymentDetailsDto(payment);

    log.info(
      {
        event: 'payment_details_loaded',

        paymentKind: payment.kind,

        hasCart: Boolean(payment.cart),

        hasShopOrder: Boolean(payment.shopOrder),
      },
      'Payment details loaded successfully'
    );

    return jsonResponse(dto, 200);
  } catch (error) {
    logError({
      log,
      error,

      message: 'Payment details request failed',

      data: {
        event: 'payment_details_load_failed',

        paymentId,
      },
    });

    return jsonResponse(
      {
        success: false,

        error: 'خطا در دریافت اطلاعات پرداخت.',
      },
      500
    );
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/payment-details',

  component: 'payment-details-api',

  /*
   * Event اختصاصی payment_details_loaded
   * ثبت می‌شود.
   */
  logSuccess: false,
});
