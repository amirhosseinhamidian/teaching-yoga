import 'server-only';

import prismadb from '@/libs/prismadb';

import {
  DiscountReservationError,
  finalizeDiscountUsage,
} from '@/server/discount/discount-reservation';

export class PaymentFinalizationError extends Error {
  constructor(
    message,
    {
      code = 'PAYMENT_FINALIZATION_ERROR',
      paymentId = null,
      productId = null,
    } = {}
  ) {
    super(message);

    this.name = 'PaymentFinalizationError';
    this.code = code;
    this.paymentId = paymentId;
    this.productId = productId;
  }
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

/**
 * Ref ID زرین‌پال در مدل Payment از نوع BigInt است.
 *
 * مقدار نامعتبر ذخیره نمی‌شود.
 */
const normalizeReferenceId = (value) => {
  const normalized =
    value === null || value === undefined ? '' : String(value).trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
};

/**
 * قفل رکورد Payment در PostgreSQL.
 *
 * این قفل مانع می‌شود دو Callback هم‌زمان:
 * - موجودی را دوبار کم کنند
 * - اشتراک را دوبار بسازند
 * - خرید دوره یا ترم را دوبار نهایی کنند
 */
const lockPaymentRow = async (tx, paymentId) => {
  const rows = await tx.$queryRaw`
    SELECT "id"
    FROM "Payment"
    WHERE "id" = ${paymentId}
    FOR UPDATE
  `;

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new PaymentFinalizationError('Payment record could not be locked.', {
      code: 'PAYMENT_NOT_FOUND',
      paymentId,
    });
  }
};

/**
 * Snapshot اشتراک در زمان خرید.
 *
 * عمداً موارد حساس زیر ذخیره نمی‌شوند:
 * - Authority
 * - Ref ID
 * - اطلاعات کارت
 * - پاسخ خام درگاه
 */
const createSubscriptionSnapshot = ({ payment, item, plan, gatewayCode }) => {
  const basePrice = Math.max(0, Number(item.price || 0));

  const discountAmount = Math.max(0, Number(item.discount || 0));

  const finalPrice = Math.max(basePrice - discountAmount, 0);

  return {
    plan: {
      id: plan.id,
      name: plan.name,

      intervalLabel: plan.intervalLabel ?? null,
      durationInDays: plan.durationInDays ?? null,
    },

    pricing: {
      basePrice,
      discountAmount,
      finalPrice,
      currency: 'IRT',
    },

    source: 'USER',

    payment: {
      paymentId: payment.id,
      amountPaidInRial: payment.amount,
      gatewayCode,
    },

    createdAt: new Date().toISOString(),
  };
};

/**
 * نهایی‌کردن خرید اشتراک‌ها.
 *
 * اشتراک جدید:
 * - از زمان فعلی شروع می‌شود؛ یا
 * - بعد از آخرین اشتراک فعال کاربر شروع می‌شود.
 */
const fulfillSubscriptions = async ({
  tx,
  payment,
  subscriptions,
  gatewayCode,
  now,
}) => {
  let createdCount = 0;

  for (const item of subscriptions) {
    const plan = item.subscriptionPlan;

    if (!plan) {
      throw new PaymentFinalizationError(
        'Subscription plan no longer exists.',
        {
          code: 'SUBSCRIPTION_PLAN_MISSING',
          paymentId: payment.id,
        }
      );
    }

    const durationDays = Number(plan.durationInDays);

    if (!Number.isSafeInteger(durationDays) || durationDays <= 0) {
      throw new PaymentFinalizationError('Subscription duration is invalid.', {
        code: 'SUBSCRIPTION_DURATION_INVALID',
        paymentId: payment.id,
      });
    }

    /*
     * رکوردهای ساخته‌شده در همین Transaction نیز در
     * تکرارهای بعدی Loop قابل مشاهده هستند.
     */
    const latestSubscription = await tx.userSubscription.findFirst({
      where: {
        userId: payment.userId,
        status: 'ACTIVE',

        endDate: {
          gte: now,
        },
      },

      orderBy: {
        endDate: 'desc',
      },

      select: {
        endDate: true,
      },
    });

    const startDate =
      latestSubscription?.endDate && latestSubscription.endDate > now
        ? latestSubscription.endDate
        : now;

    const endDate = new Date(
      startDate.getTime() + durationDays * DAY_IN_MILLISECONDS
    );

    await tx.userSubscription.create({
      data: {
        userId: payment.userId,
        planId: plan.id,

        status: 'ACTIVE',

        startDate,
        endDate,

        meta: createSubscriptionSnapshot({
          payment,
          item,
          plan,
          gatewayCode,
        }),
      },
    });

    createdCount += 1;
  }

  return createdCount;
};

/**
 * نهایی‌کردن خرید مستقیم دوره‌ها.
 */
const fulfillCoursePurchases = async ({ tx, payment, cartCourses }) => {
  const uniqueCourseIds = new Set(
    cartCourses
      .map((item) => item.courseId)
      .filter((courseId) => Number.isInteger(courseId))
  );

  for (const courseId of uniqueCourseIds) {
    await tx.userCourse.upsert({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId,
        },
      },

      update: {
        status: 'ACTIVE',
      },

      create: {
        userId: payment.userId,
        courseId,
        status: 'ACTIVE',
      },
    });
  }

  return uniqueCourseIds.size;
};

/**
 * نهایی‌کردن خرید ترم‌ها.
 */
const fulfillTermPurchases = async ({ tx, payment, cartTerms }) => {
  const uniqueTermIds = new Set(
    cartTerms
      .map((item) => item.termId)
      .filter((termId) => Number.isInteger(termId))
  );

  for (const termId of uniqueTermIds) {
    await tx.userTerm.upsert({
      where: {
        userId_termId: {
          userId: payment.userId,
          termId,
        },
      },

      update: {},

      create: {
        userId: payment.userId,
        termId,
      },
    });
  }

  return uniqueTermIds.size;
};

/**
 * نهایی‌کردن Cart دیجیتال:
 * - دوره
 * - ترم
 * - اشتراک
 * - تغییر وضعیت Cart
 */
const fulfillCart = async ({ tx, payment, cart, gatewayCode, now }) => {
  if (!cart) {
    return {
      courseCount: 0,
      termCount: 0,
      subscriptionCount: 0,
    };
  }

  if (cart.userId !== payment.userId) {
    throw new PaymentFinalizationError(
      'Cart ownership does not match payment ownership.',
      {
        code: 'PAYMENT_CART_OWNER_MISMATCH',
        paymentId: payment.id,
      }
    );
  }

  const cartCourses = Array.isArray(cart.cartCourses) ? cart.cartCourses : [];

  const cartTerms = Array.isArray(cart.cartTerms) ? cart.cartTerms : [];

  const subscriptions = Array.isArray(cart.cartSubscriptions)
    ? cart.cartSubscriptions
    : [];

  if (
    cartCourses.length === 0 &&
    cartTerms.length === 0 &&
    subscriptions.length === 0
  ) {
    throw new PaymentFinalizationError('Payment cart is empty.', {
      code: 'PAYMENT_CART_EMPTY',
      paymentId: payment.id,
    });
  }

  const courseCount = await fulfillCoursePurchases({
    tx,
    payment,
    cartCourses,
  });

  const termCount = await fulfillTermPurchases({
    tx,
    payment,
    cartTerms,
  });

  const subscriptionCount = await fulfillSubscriptions({
    tx,
    payment,
    subscriptions,
    gatewayCode,
    now,
  });

  await tx.cart.update({
    where: {
      id: cart.id,
    },

    data: {
      status: 'COMPLETED',
    },
  });

  return {
    courseCount,
    termCount,
    subscriptionCount,
  };
};

/**
 * نهایی‌کردن سفارش فروشگاه:
 * - بررسی مالکیت
 * - بررسی آیتم‌ها
 * - کاهش اتمیک موجودی
 * - موفق‌کردن سفارش
 * - بستن ShopCart
 */
const fulfillShopOrder = async ({ tx, payment, order }) => {
  if (!order) {
    return {
      productLineCount: 0,
      stockChanged: false,
    };
  }

  if (order.userId !== payment.userId) {
    throw new PaymentFinalizationError(
      'Shop order ownership does not match payment ownership.',
      {
        code: 'PAYMENT_ORDER_OWNER_MISMATCH',
        paymentId: payment.id,
      }
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  if (items.length === 0) {
    throw new PaymentFinalizationError('Paid shop order has no items.', {
      code: 'PAYMENT_ORDER_EMPTY',
      paymentId: payment.id,
    });
  }

  let stockChanged = false;

  /*
   * برای سازگاری با رکوردهای قدیمی:
   *
   * اگر سفارش قبلاً SUCCESSFUL شده باشد،
   * موجودی دوباره کم نمی‌شود.
   */
  if (order.paymentStatus !== 'SUCCESSFUL') {
    for (const item of items) {
      const quantity = Number(item.qty);

      if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        throw new PaymentFinalizationError('Shop order quantity is invalid.', {
          code: 'PAYMENT_ORDER_QUANTITY_INVALID',
          paymentId: payment.id,
          productId: item.productId,
        });
      }

      /*
       * کاهش موجودی فقط وقتی انجام می‌شود که:
       * - محصول فعال باشد
       * - موجودی کافی باشد
       */
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: item.productId,
          isActive: true,

          stock: {
            gte: quantity,
          },
        },

        data: {
          stock: {
            decrement: quantity,
          },
        },
      });

      if (stockUpdate.count !== 1) {
        throw new PaymentFinalizationError(
          'Product stock is not sufficient for the paid order.',
          {
            code: 'PAID_ORDER_STOCK_UNAVAILABLE',
            paymentId: payment.id,
            productId: item.productId,
          }
        );
      }
    }

    stockChanged = true;
  }

  await tx.shopOrder.update({
    where: {
      id: order.id,
    },

    data: {
      paymentStatus: 'SUCCESSFUL',

      /*
       * Callback تکراری نباید وضعیت‌های جلوتر مثل
       * PACKED یا SHIPPED را به PROCESSING برگرداند.
       */
      status:
        order.status === 'PENDING_PAYMENT' || order.status === 'CANCELLED'
          ? 'PROCESSING'
          : order.status,
    },
  });

  if (order.shopCartId) {
    await tx.shopCart.update({
      where: {
        id: order.shopCartId,
      },

      data: {
        status: 'CHECKED_OUT',
        isActive: false,
      },
    });
  }

  return {
    productLineCount: items.length,
    stockChanged,
  };
};

/**
 * نهایی‌کردن کامل Payment تأییدشده.
 *
 * این تابع فقط بعد از Verify موفق درگاه فراخوانی می‌شود.
 */
export const finalizeVerifiedPayment = async ({
  paymentId,
  gatewayCode,
  referenceId,
}) => {
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw new PaymentFinalizationError('Payment ID is invalid.', {
      code: 'PAYMENT_ID_INVALID',
      paymentId,
    });
  }

  const normalizedGatewayCode = Number(gatewayCode);

  if (![100, 101].includes(normalizedGatewayCode)) {
    throw new PaymentFinalizationError('Gateway result is not successful.', {
      code: 'PAYMENT_GATEWAY_RESULT_INVALID',
      paymentId,
    });
  }

  const transactionId = normalizeReferenceId(referenceId);

  return prismadb.$transaction(
    async (tx) => {
      await lockPaymentRow(tx, paymentId);

      /*
       * استفاده از include باعث می‌شود تمام Scalarهای
       * Payment، Cart و ShopOrder نیز دریافت شوند.
       */
      const payment = await tx.payment.findUnique({
        where: {
          id: paymentId,
        },

        include: {
          cart: {
            include: {
              cartCourses: {
                select: {
                  courseId: true,
                },
              },

              cartTerms: {
                select: {
                  termId: true,
                },
              },

              cartSubscriptions: {
                include: {
                  subscriptionPlan: {
                    select: {
                      id: true,
                      name: true,
                      intervalLabel: true,
                      durationInDays: true,
                    },
                  },
                },
              },
            },
          },

          shopOrder: {
            include: {
              items: {
                select: {
                  id: true,
                  productId: true,
                  qty: true,
                },
              },

              /*
               * برای ثبت قطعی مصرف تخفیف فروشگاه.
               */
              shopCart: {
                select: {
                  discountCodeId: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new PaymentFinalizationError('Payment record was not found.', {
          code: 'PAYMENT_NOT_FOUND',
          paymentId,
        });
      }

      /*
       * Idempotency:
       *
       * Callback تکراری هیچ Side Effect جدیدی ایجاد نمی‌کند.
       */
      if (payment.status === 'SUCCESSFUL') {
        return {
          paymentId: payment.id,
          alreadyFinalized: true,

          courseCount: 0,
          termCount: 0,
          subscriptionCount: 0,

          productLineCount: 0,
          stockChanged: false,

          discountUsageCount: 0,
          legacyDiscountUsageCount: 0,
        };
      }

      if (!payment.cart && !payment.shopOrder) {
        throw new PaymentFinalizationError(
          'Payment has no fulfillment target.',
          {
            code: 'PAYMENT_TARGET_MISSING',
            paymentId,
          }
        );
      }

      const now = new Date();

      /*
       * ابتدا دسترسی‌های دیجیتال تکمیل می‌شوند.
       */
      const cartResult = await fulfillCart({
        tx,
        payment,
        cart: payment.cart,
        gatewayCode: normalizedGatewayCode,
        now,
      });

      /*
       * سپس سفارش فروشگاه و موجودی تکمیل می‌شوند.
       */
      const shopResult = await fulfillShopOrder({
        tx,
        payment,
        order: payment.shopOrder,
      });

      /*
       * مصرف قطعی کد تخفیف فقط بعد از Verify موفق و
       * در همان Transaction ثبت می‌شود.
       */
      let discountUsage;

      try {
        discountUsage = await finalizeDiscountUsage({
          tx,
          payment,
          cart: payment.cart,
          order: payment.shopOrder,
        });
      } catch (error) {
        if (error instanceof DiscountReservationError) {
          throw new PaymentFinalizationError(error.message, {
            code: error.code,
            paymentId: payment.id,
          });
        }

        throw error;
      }

      /*
       * موفق‌شدن Payment آخرین عملیات Transaction است.
       *
       * شکست هر مرحله قبل از این بخش باعث Rollback کامل می‌شود.
       */
      await tx.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: 'SUCCESSFUL',

          transactionId: transactionId ?? payment.transactionId ?? null,
        },
      });

      return {
        paymentId: payment.id,
        alreadyFinalized: false,

        ...cartResult,
        ...shopResult,

        discountUsageCount: discountUsage.createdCount,

        /*
         * رکوردهایی که در پیاده‌سازی قدیمی
         * پیش از پرداخت ساخته شده بودند.
         */
        legacyDiscountUsageCount: discountUsage.alreadyRecordedCount,
      };
    },
    {
      maxWait: 5000,
      timeout: 20000,
    }
  );
};
