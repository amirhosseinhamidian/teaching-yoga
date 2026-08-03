import 'server-only';

import prismadb from '@/libs/prismadb';
import { buildCartResponse } from '@/utils/buildCartResponse';

const DEFAULT_RESERVATION_TTL_SECONDS = 15 * 60;
const DEFAULT_PAYMENT_RESERVATION_TTL_SECONDS = 60 * 60;

const CLEAR_CART_DISCOUNT = {
  discountCodeId: null,
  discountCodeAmount: 0,
  discountAppliedAt: null,
};

const CLEAR_SHOP_CART_DISCOUNT = {
  discountCodeId: null,
  discountCodeAmount: 0,
  discountAppliedAt: null,
};

export class DiscountReservationError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = 'DISCOUNT_RESERVATION_ERROR',
      discountCodeId = null,
    } = {}
  ) {
    super(message);

    this.name = 'DiscountReservationError';
    this.status = status;
    this.code = code;
    this.discountCodeId = discountCodeId;
  }
}

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

const getReservationTtlSeconds = () => {
  return getPositiveInteger(
    process.env.DISCOUNT_RESERVATION_TTL_SECONDS,
    DEFAULT_RESERVATION_TTL_SECONDS
  );
};

const getPaymentReservationTtlSeconds = () => {
  return getPositiveInteger(
    process.env.DISCOUNT_PAYMENT_RESERVATION_TTL_SECONDS,
    DEFAULT_PAYMENT_RESERVATION_TTL_SECONDS
  );
};

const getReservationCutoff = () => {
  return new Date(Date.now() - getReservationTtlSeconds() * 1000);
};

const getPaymentReservationDate = () => {
  /*
   * discountAppliedAt شروع Lease است.
   *
   * برای اینکه Lease پرداخت طولانی‌تر باشد، زمان شروع را
   * طوری تنظیم می‌کنیم که با TTL عمومی، در زمان موردنظر منقضی شود.
   */
  const normalTtl = getReservationTtlSeconds();
  const paymentTtl = getPaymentReservationTtlSeconds();

  const offsetSeconds = Math.max(0, paymentTtl - normalTtl);

  return new Date(Date.now() + offsetSeconds * 1000);
};

const clampInteger = (
  value,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return minimum;
  }

  return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
};

const normalizeDiscountCode = (value) => {
  const code =
    typeof value === 'string'
      ? value.normalize('NFKC').trim().replace(/\s+/g, '')
      : '';

  if (!code || code.length > 100) {
    throw new DiscountReservationError('کد تخفیف معتبر نیست.', {
      status: 400,
      code: 'DISCOUNT_CODE_INVALID',
    });
  }

  return code;
};

const computeDiscountAmount = ({ baseAmount, percent, maxDiscountAmount }) => {
  const base = clampInteger(baseAmount);

  if (base <= 0) {
    return 0;
  }

  const normalizedPercent = Number(percent);

  if (!Number.isFinite(normalizedPercent) || normalizedPercent <= 0) {
    return 0;
  }

  let amount = Math.floor((base * normalizedPercent) / 100);

  if (maxDiscountAmount !== null && maxDiscountAmount !== undefined) {
    amount = Math.min(amount, Number(maxDiscountAmount));
  }

  return clampInteger(amount, 0, base);
};

const splitDiscountProportionally = (totalDiscount, courseBase, shopBase) => {
  const normalizedCourseBase = clampInteger(courseBase);
  const normalizedShopBase = clampInteger(shopBase);
  const normalizedDiscount = clampInteger(totalDiscount);

  const totalBase = normalizedCourseBase + normalizedShopBase;

  if (normalizedDiscount <= 0 || totalBase <= 0) {
    return {
      courseDiscount: 0,
      shopDiscount: 0,
    };
  }

  if (normalizedCourseBase <= 0) {
    return {
      courseDiscount: 0,
      shopDiscount: Math.min(normalizedDiscount, normalizedShopBase),
    };
  }

  if (normalizedShopBase <= 0) {
    return {
      courseDiscount: Math.min(normalizedDiscount, normalizedCourseBase),
      shopDiscount: 0,
    };
  }

  const courseDiscount = Math.floor(
    (normalizedDiscount * normalizedCourseBase) / totalBase
  );

  const shopDiscount = normalizedDiscount - courseDiscount;

  return {
    courseDiscount: Math.min(courseDiscount, normalizedCourseBase),
    shopDiscount: Math.min(shopDiscount, normalizedShopBase),
  };
};

const getCourseCartBase = async (userId) => {
  const calculation = await buildCartResponse(userId);

  const cartId = calculation?.cart?.id ?? null;

  if (!cartId) {
    return {
      cartId: null,
      base: 0,
      discountCodeId: null,
      discountAppliedAt: null,
    };
  }

  const cart = await prismadb.cart.findFirst({
    where: {
      id: cartId,
      userId,
      status: 'PENDING',
    },

    select: {
      id: true,
      discountCodeId: true,
      discountAppliedAt: true,
    },
  });

  return {
    cartId: cart?.id ?? null,

    /*
     * همان منطق قبلی پروژه:
     * totalPrice مبلغ قبل از کد تخفیف در Cart Response است.
     */
    base: clampInteger(calculation?.cart?.totalPrice || 0),

    discountCodeId: cart?.discountCodeId ?? null,
    discountAppliedAt: cart?.discountAppliedAt ?? null,
  };
};

const getShopCartBase = async (userId) => {
  const shopCart = await prismadb.shopCart.findFirst({
    where: {
      userId,
      status: 'PENDING',
      isActive: true,
    },

    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              isActive: true,
              categoryId: true,
            },
          },
        },
      },
    },
  });

  if (!shopCart) {
    return {
      shopCartId: null,
      base: 0,
      categoryBaseMap: new Map(),
      discountCodeId: null,
      discountAppliedAt: null,
    };
  }

  const items = (shopCart.items || []).filter((item) => item.product?.isActive);

  const base = items.reduce((sum, item) => {
    return (
      sum +
      clampInteger(item.unitPrice) * Math.max(1, clampInteger(item.qty, 1))
    );
  }, 0);

  const categoryBaseMap = new Map();

  for (const item of items) {
    const categoryId = item.product?.categoryId;

    if (!categoryId) {
      continue;
    }

    const itemTotal =
      clampInteger(item.unitPrice) * Math.max(1, clampInteger(item.qty, 1));

    categoryBaseMap.set(
      categoryId,
      (categoryBaseMap.get(categoryId) || 0) + itemTotal
    );
  }

  return {
    shopCartId: shopCart.id,
    base: clampInteger(base),
    categoryBaseMap,
    discountCodeId: shopCart.discountCodeId ?? null,
    discountAppliedAt: shopCart.discountAppliedAt ?? null,
  };
};

const buildUpdatedCartSummary = async (userId) => {
  const courseResponse = await buildCartResponse(userId);

  const shopCart = await prismadb.shopCart.findFirst({
    where: {
      userId,
      status: 'PENDING',
      isActive: true,
    },

    select: {
      id: true,
      discountCodeAmount: true,

      items: {
        select: {
          qty: true,
          unitPrice: true,

          product: {
            select: {
              isActive: true,
            },
          },
        },
      },
    },
  });

  const shopSubtotal = (shopCart?.items || [])
    .filter((item) => item.product?.isActive)
    .reduce((sum, item) => {
      return (
        sum +
        clampInteger(item.unitPrice) * Math.max(1, clampInteger(item.qty, 1))
      );
    }, 0);

  const shopDiscountAmount = clampInteger(shopCart?.discountCodeAmount || 0);

  return {
    cart: courseResponse?.cart || null,

    shop: {
      id: shopCart?.id ?? null,
      subtotal: shopSubtotal,
      discountAmount: shopDiscountAmount,
      payable: Math.max(0, shopSubtotal - shopDiscountAmount),
    },
  };
};

const lockDiscountCode = async (tx, discountCodeId) => {
  const rows = await tx.$queryRaw`
    SELECT "id"
    FROM "DiscountCode"
    WHERE "id" = ${discountCodeId}
    FOR UPDATE
  `;

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new DiscountReservationError('کد تخفیف یافت نشد.', {
      status: 404,
      code: 'DISCOUNT_CODE_NOT_FOUND',
      discountCodeId,
    });
  }
};

const countActiveReservations = async ({
  tx,
  discountCodeId,
  excludedUserId,
  cutoff,
}) => {
  /*
   * UNION باعث می‌شود اگر همان کاربر کد را روی Cart و ShopCart
   * هم‌زمان دارد، فقط یک رزرو شمرده شود.
   *
   * UserDiscountهای قدیمی از شمارش رزرو کنار گذاشته می‌شوند،
   * چون usageCount آن‌ها قبلاً افزایش یافته است.
   */
  const rows = await tx.$queryRaw`
    SELECT COUNT(*)::int AS "count"
    FROM (
      SELECT cart."userId"
      FROM "Cart" AS cart
      WHERE cart."discountCodeId" = ${discountCodeId}
        AND cart."status" = 'PENDING'
        AND cart."discountAppliedAt" > ${cutoff}
        AND cart."userId" <> ${excludedUserId}
        AND NOT EXISTS (
          SELECT 1
          FROM "UserDiscount" AS used_discount
          WHERE used_discount."userId" = cart."userId"
            AND used_discount."discountCodeId" = ${discountCodeId}
        )

      UNION

      SELECT shop_cart."userId"
      FROM "ShopCart" AS shop_cart
      WHERE shop_cart."discountCodeId" = ${discountCodeId}
        AND shop_cart."status" = 'PENDING'
        AND shop_cart."isActive" = true
        AND shop_cart."discountAppliedAt" > ${cutoff}
        AND shop_cart."userId" <> ${excludedUserId}
        AND NOT EXISTS (
          SELECT 1
          FROM "UserDiscount" AS used_discount
          WHERE used_discount."userId" = shop_cart."userId"
            AND used_discount."discountCodeId" = ${discountCodeId}
        )
    ) AS active_reservations
  `;

  return Number(rows?.[0]?.count || 0);
};

const clearExpiredDiscountsForUser = async ({ tx, userId, cutoff }) => {
  const [courseResult, shopResult] = await Promise.all([
    tx.cart.updateMany({
      where: {
        userId,
        status: 'PENDING',
        discountCodeId: {
          not: null,
        },
        discountAppliedAt: {
          lte: cutoff,
        },
      },

      data: CLEAR_CART_DISCOUNT,
    }),

    tx.shopCart.updateMany({
      where: {
        userId,
        status: 'PENDING',
        isActive: true,
        discountCodeId: {
          not: null,
        },
        discountAppliedAt: {
          lte: cutoff,
        },
      },

      data: CLEAR_SHOP_CART_DISCOUNT,
    }),
  ]);

  return courseResult.count + shopResult.count;
};

const validateDiscount = ({ discount, now }) => {
  if (!discount) {
    throw new DiscountReservationError('کد تخفیف نامعتبر است.', {
      status: 404,
      code: 'DISCOUNT_CODE_NOT_FOUND',
    });
  }

  if (!discount.isActive) {
    throw new DiscountReservationError('این کد تخفیف غیرفعال است.', {
      status: 400,
      code: 'DISCOUNT_CODE_INACTIVE',
      discountCodeId: discount.id,
    });
  }

  if (discount.expiryDate && discount.expiryDate <= now) {
    throw new DiscountReservationError('کد تخفیف منقضی شده است.', {
      status: 400,
      code: 'DISCOUNT_CODE_EXPIRED',
      discountCodeId: discount.id,
    });
  }
};

export const reserveDiscountForUser = async ({ userId, code: rawCode }) => {
  const code = normalizeDiscountCode(rawCode);

  const [courseCart, shopCart] = await Promise.all([
    getCourseCartBase(userId),
    getShopCartBase(userId),
  ]);

  const now = new Date();
  const cutoff = getReservationCutoff();

  await prismadb.$transaction(
    async (tx) => {
      let discount = await tx.discountCode.findUnique({
        where: {
          code,
        },

        include: {
          course: {
            select: {
              id: true,
            },
          },

          productCategory: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!discount) {
        throw new DiscountReservationError('کد تخفیف نامعتبر است.', {
          status: 404,
          code: 'DISCOUNT_CODE_NOT_FOUND',
        });
      }

      await lockDiscountCode(tx, discount.id);

      /*
       * پس از Lock دوباره خوانده می‌شود تا جدیدترین usageCount
       * و وضعیت کد مبنای تصمیم باشد.
       */
      discount = await tx.discountCode.findUnique({
        where: {
          id: discount.id,
        },

        include: {
          course: {
            select: {
              id: true,
            },
          },

          productCategory: {
            select: {
              id: true,
            },
          },
        },
      });

      validateDiscount({
        discount,
        now,
      });

      const usedBefore = await tx.userDiscount.findUnique({
        where: {
          userId_discountCodeId: {
            userId,
            discountCodeId: discount.id,
          },
        },

        select: {
          id: true,
        },
      });

      if (usedBefore) {
        throw new DiscountReservationError(
          'قبلاً از این کد تخفیف استفاده کرده‌اید.',
          {
            status: 409,
            code: 'DISCOUNT_ALREADY_USED',
            discountCodeId: discount.id,
          }
        );
      }

      await clearExpiredDiscountsForUser({
        tx,
        userId,
        cutoff,
      });

      const [currentCourseCart, currentShopCart] = await Promise.all([
        courseCart.cartId
          ? tx.cart.findFirst({
              where: {
                id: courseCart.cartId,
                userId,
                status: 'PENDING',
              },

              select: {
                id: true,
                discountCodeId: true,
              },
            })
          : Promise.resolve(null),

        shopCart.shopCartId
          ? tx.shopCart.findFirst({
              where: {
                id: shopCart.shopCartId,
                userId,
                status: 'PENDING',
                isActive: true,
              },

              select: {
                id: true,
                discountCodeId: true,
              },
            })
          : Promise.resolve(null),
      ]);

      const appliedDiscountIds = new Set(
        [
          currentCourseCart?.discountCodeId,
          currentShopCart?.discountCodeId,
        ].filter(Boolean)
      );

      if (appliedDiscountIds.size > 0 && !appliedDiscountIds.has(discount.id)) {
        throw new DiscountReservationError(
          'روی یکی از سبدها قبلاً کد تخفیف دیگری اعمال شده است.',
          {
            status: 409,
            code: 'ANOTHER_DISCOUNT_RESERVED',
            discountCodeId: discount.id,
          }
        );
      }

      const activeReservations = await countActiveReservations({
        tx,
        discountCodeId: discount.id,
        excludedUserId: userId,
        cutoff,
      });

      if (
        discount.usageLimit &&
        discount.usageCount + activeReservations >= discount.usageLimit
      ) {
        throw new DiscountReservationError(
          'ظرفیت استفاده از این کد تخفیف تکمیل شده است.',
          {
            status: 409,
            code: 'DISCOUNT_CAPACITY_EXHAUSTED',
            discountCodeId: discount.id,
          }
        );
      }

      const courseBase = clampInteger(courseCart.base);
      const shopBase = clampInteger(shopCart.base);

      let baseForDiscount = 0;

      switch (discount.appliesTo) {
        case 'ALL':
          baseForDiscount = courseBase + shopBase;
          break;

        case 'COURSE': {
          if (!courseCart.cartId) {
            throw new DiscountReservationError('سبد خرید دوره‌ها یافت نشد.', {
              status: 404,
              code: 'COURSE_CART_NOT_FOUND',
              discountCodeId: discount.id,
            });
          }

          if (discount.courseId) {
            const courseExists = await tx.cartCourse.findFirst({
              where: {
                cartId: courseCart.cartId,
                courseId: discount.courseId,
              },

              select: {
                id: true,
              },
            });

            if (!courseExists) {
              throw new DiscountReservationError(
                'این کد برای دوره موجود در سبد شما قابل استفاده نیست.',
                {
                  status: 400,
                  code: 'DISCOUNT_COURSE_NOT_IN_CART',
                  discountCodeId: discount.id,
                }
              );
            }
          }

          baseForDiscount = courseBase;
          break;
        }

        case 'PRODUCT':
          baseForDiscount = shopBase;
          break;

        case 'PRODUCT_CATEGORY': {
          if (!discount.productCategoryId) {
            throw new DiscountReservationError(
              'دسته‌بندی کد تخفیف معتبر نیست.',
              {
                status: 400,
                code: 'DISCOUNT_CATEGORY_INVALID',
                discountCodeId: discount.id,
              }
            );
          }

          baseForDiscount = clampInteger(
            shopCart.categoryBaseMap.get(discount.productCategoryId) || 0
          );

          break;
        }

        default:
          throw new DiscountReservationError('نوع کد تخفیف معتبر نیست.', {
            status: 400,
            code: 'DISCOUNT_SCOPE_INVALID',
            discountCodeId: discount.id,
          });
      }

      if (baseForDiscount <= 0) {
        throw new DiscountReservationError(
          'این کد برای اقلام فعلی سبد قابل استفاده نیست.',
          {
            status: 400,
            code: 'DISCOUNT_BASE_EMPTY',
            discountCodeId: discount.id,
          }
        );
      }

      if (
        discount.minPurchaseAmount &&
        baseForDiscount < Number(discount.minPurchaseAmount)
      ) {
        throw new DiscountReservationError(
          'مبلغ سبد کمتر از حداقل خرید موردنیاز این کد است.',
          {
            status: 400,
            code: 'DISCOUNT_MINIMUM_NOT_REACHED',
            discountCodeId: discount.id,
          }
        );
      }

      const totalDiscount = computeDiscountAmount({
        baseAmount: baseForDiscount,
        percent: discount.discountPercent,
        maxDiscountAmount: discount.maxDiscountAmount,
      });

      if (totalDiscount <= 0) {
        throw new DiscountReservationError(
          'امکان اعمال این کد تخفیف وجود ندارد.',
          {
            status: 400,
            code: 'DISCOUNT_AMOUNT_INVALID',
            discountCodeId: discount.id,
          }
        );
      }

      if (discount.appliesTo === 'COURSE') {
        await tx.cart.update({
          where: {
            id: courseCart.cartId,
          },

          data: {
            discountCodeId: discount.id,
            discountCodeAmount: totalDiscount,
            discountAppliedAt: now,
          },
        });

        if (shopCart.shopCartId) {
          await tx.shopCart.update({
            where: {
              id: shopCart.shopCartId,
            },

            data: CLEAR_SHOP_CART_DISCOUNT,
          });
        }
      }

      if (
        discount.appliesTo === 'PRODUCT' ||
        discount.appliesTo === 'PRODUCT_CATEGORY'
      ) {
        if (!shopCart.shopCartId) {
          throw new DiscountReservationError('سبد خرید محصولات یافت نشد.', {
            status: 404,
            code: 'SHOP_CART_NOT_FOUND',
            discountCodeId: discount.id,
          });
        }

        await tx.shopCart.update({
          where: {
            id: shopCart.shopCartId,
          },

          data: {
            discountCodeId: discount.id,
            discountCodeAmount: totalDiscount,
            discountAppliedAt: now,
          },
        });

        if (courseCart.cartId) {
          await tx.cart.update({
            where: {
              id: courseCart.cartId,
            },

            data: CLEAR_CART_DISCOUNT,
          });
        }
      }

      if (discount.appliesTo === 'ALL') {
        const { courseDiscount, shopDiscount } = splitDiscountProportionally(
          totalDiscount,
          courseBase,
          shopBase
        );

        if (courseCart.cartId) {
          await tx.cart.update({
            where: {
              id: courseCart.cartId,
            },

            data:
              courseDiscount > 0
                ? {
                    discountCodeId: discount.id,
                    discountCodeAmount: courseDiscount,
                    discountAppliedAt: now,
                  }
                : CLEAR_CART_DISCOUNT,
          });
        }

        if (shopCart.shopCartId) {
          await tx.shopCart.update({
            where: {
              id: shopCart.shopCartId,
            },

            data:
              shopDiscount > 0
                ? {
                    discountCodeId: discount.id,
                    discountCodeAmount: shopDiscount,
                    discountAppliedAt: now,
                  }
                : CLEAR_SHOP_CART_DISCOUNT,
          });
        }
      }
    },
    {
      maxWait: 5000,
      timeout: 15000,
    }
  );

  return buildUpdatedCartSummary(userId);
};

export const releaseExpiredDiscountReservations = async ({ userId }) => {
  const cutoff = getReservationCutoff();

  const clearedCount = await prismadb.$transaction(
    async (tx) => {
      return clearExpiredDiscountsForUser({
        tx,
        userId,
        cutoff,
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );

  const summary = await buildUpdatedCartSummary(userId);

  return {
    cleared: clearedCount > 0,
    clearedCount,
    ...summary,
  };
};

export const refreshDiscountReservationsForPayment = async ({
  userId,
  cartId = null,
  shopOrderId = null,
}) => {
  const now = new Date();
  const cutoff = getReservationCutoff();
  const paymentReservationDate = getPaymentReservationDate();

  return prismadb.$transaction(
    async (tx) => {
      let shopCartId = null;

      if (shopOrderId) {
        const order = await tx.shopOrder.findFirst({
          where: {
            id: shopOrderId,
            userId,
          },

          select: {
            shopCartId: true,
          },
        });

        shopCartId = order?.shopCartId ?? null;
      }

      const [cart, shopCart] = await Promise.all([
        cartId
          ? tx.cart.findFirst({
              where: {
                id: cartId,
                userId,
                status: 'PENDING',
              },

              select: {
                id: true,
                discountCodeId: true,
                discountAppliedAt: true,
              },
            })
          : Promise.resolve(null),

        shopCartId
          ? tx.shopCart.findFirst({
              where: {
                id: shopCartId,
                userId,
                status: 'PENDING',
                isActive: true,
              },

              select: {
                id: true,
                discountCodeId: true,
                discountAppliedAt: true,
              },
            })
          : Promise.resolve(null),
      ]);

      const discountedTargets = [
        cart?.discountCodeId
          ? {
              type: 'CART',
              id: cart.id,
              discountCodeId: cart.discountCodeId,
              appliedAt: cart.discountAppliedAt,
            }
          : null,

        shopCart?.discountCodeId
          ? {
              type: 'SHOP_CART',
              id: shopCart.id,
              discountCodeId: shopCart.discountCodeId,
              appliedAt: shopCart.discountAppliedAt,
            }
          : null,
      ].filter(Boolean);

      if (!discountedTargets.length) {
        return {
          refreshedCount: 0,
        };
      }

      const uniqueDiscountIds = [
        ...new Set(discountedTargets.map((target) => target.discountCodeId)),
      ];

      for (const discountCodeId of uniqueDiscountIds) {
        await lockDiscountCode(tx, discountCodeId);

        const discount = await tx.discountCode.findUnique({
          where: {
            id: discountCodeId,
          },
        });

        validateDiscount({
          discount,
          now,
        });
      }

      for (const target of discountedTargets) {
        if (!target.appliedAt || target.appliedAt <= cutoff) {
          if (target.type === 'CART') {
            await tx.cart.update({
              where: {
                id: target.id,
              },

              data: CLEAR_CART_DISCOUNT,
            });
          } else {
            await tx.shopCart.update({
              where: {
                id: target.id,
              },

              data: CLEAR_SHOP_CART_DISCOUNT,
            });
          }

          throw new DiscountReservationError(
            'مهلت استفاده از کد تخفیف پایان یافته است؛ کد را دوباره اعمال کنید.',
            {
              status: 409,
              code: 'DISCOUNT_RESERVATION_EXPIRED',
              discountCodeId: target.discountCodeId,
            }
          );
        }
      }

      if (cart?.discountCodeId) {
        await tx.cart.update({
          where: {
            id: cart.id,
          },

          data: {
            discountAppliedAt: paymentReservationDate,
          },
        });
      }

      if (shopCart?.discountCodeId) {
        await tx.shopCart.update({
          where: {
            id: shopCart.id,
          },

          data: {
            discountAppliedAt: paymentReservationDate,
          },
        });
      }

      return {
        refreshedCount: discountedTargets.length,
      };
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
};

export const finalizeDiscountUsage = async ({ tx, payment, cart, order }) => {
  const discountCodeIds = new Set();

  if (Number.isInteger(cart?.discountCodeId)) {
    discountCodeIds.add(cart.discountCodeId);
  }

  if (Number.isInteger(order?.shopCart?.discountCodeId)) {
    discountCodeIds.add(order.shopCart.discountCodeId);
  }

  let createdCount = 0;
  let alreadyRecordedCount = 0;

  for (const discountCodeId of discountCodeIds) {
    await lockDiscountCode(tx, discountCodeId);

    const discount = await tx.discountCode.findUnique({
      where: {
        id: discountCodeId,
      },

      select: {
        id: true,
      },
    });

    if (!discount) {
      throw new DiscountReservationError('کد تخفیف مربوط به پرداخت یافت نشد.', {
        status: 500,
        code: 'PAYMENT_DISCOUNT_MISSING',
        discountCodeId,
      });
    }

    /*
     * skipDuplicates برای سازگاری با داده‌های قدیمی نیز ضروری است.
     * در نسخه قدیمی UserDiscount قبل از پرداخت ساخته می‌شد.
     */
    const usage = await tx.userDiscount.createMany({
      data: [
        {
          userId: payment.userId,
          discountCodeId,
        },
      ],

      skipDuplicates: true,
    });

    if (usage.count !== 1) {
      alreadyRecordedCount += 1;
      continue;
    }

    const updateResult = await tx.discountCode.updateMany({
      where: {
        id: discountCodeId,
      },

      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    if (updateResult.count !== 1) {
      throw new DiscountReservationError('ثبت مصرف کد تخفیف با خطا مواجه شد.', {
        status: 500,
        code: 'DISCOUNT_USAGE_UPDATE_FAILED',
        discountCodeId,
      });
    }

    createdCount += 1;
  }

  return {
    createdCount,
    alreadyRecordedCount,
  };
};
