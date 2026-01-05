/* eslint-disable no-undef */
// /app/api/apply-discount-code/route.js

import prismadb from '@/libs/prismadb';
import { buildCartResponse } from '@/utils/buildCartResponse';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

const TEN_MIN = 10 * 60 * 1000;

const clampInt = (v, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  Math.max(min, Math.min(max, Math.trunc(Number(v || 0))));

const isExpired = (appliedAt) => {
  if (!appliedAt) return false;
  const elapsed = Date.now() - new Date(appliedAt).getTime();
  return elapsed > TEN_MIN;
};

const clearCartDiscountData = {
  discountCodeId: null,
  discountAppliedAt: null,
  discountCodeAmount: 0,
};

const clearShopCartDiscountData = {
  discountCodeId: null,
  discountAppliedAt: null,
  discountCodeAmount: 0,
};

/**
 * محاسبه subtotal فروشگاه (قیمت نهایی پرداختی قبل از کدتخفیف)
 * - اینجا unitPrice را «قیمت فروش/نهایی محصول» فرض می‌کنیم
 */
async function getShopCartBase(userId) {
  const shopCart = await prismadb.shopCart.findFirst({
    where: { userId, status: 'PENDING', isActive: true },
    include: {
      items: {
        include: {
          product: { select: { id: true, isActive: true, categoryId: true } },
        },
      },
    },
  });

  if (!shopCart) {
    return {
      shopCartId: null,
      base: 0,
      categoryBaseMap: new Map(),
      hasDiscount: false,
      discountAppliedAt: null,
      discountCodeId: null,
    };
  }

  const items = (shopCart.items || []).filter((it) => it.product?.isActive);

  const base = items.reduce(
    (sum, it) => sum + Number(it.unitPrice || 0) * Number(it.qty || 0),
    0
  );

  const categoryBaseMap = new Map();
  for (const it of items) {
    const catId = it.product?.categoryId;
    if (!catId) continue;
    const cur = categoryBaseMap.get(catId) || 0;
    categoryBaseMap.set(
      catId,
      cur + Number(it.unitPrice || 0) * Number(it.qty || 0)
    );
  }

  return {
    shopCartId: shopCart.id,
    base: clampInt(base, 0),
    categoryBaseMap,
    hasDiscount: Boolean(shopCart.discountCodeId),
    discountAppliedAt: shopCart.discountAppliedAt,
    discountCodeId: shopCart.discountCodeId,
  };
}

/**
 * محاسبه base دوره‌ها:
 * ✅ باید روی مبلغ «قابل پرداخت قبل از کدتخفیف» اعمال شود (بعد از تخفیف‌های خود دوره/ترم)
 * یعنی از totalPrice استفاده می‌کنیم.
 */
async function getCourseCartBase(userId) {
  const calc = await buildCartResponse(userId);
  const cartId = calc?.cart?.id ?? null;

  if (!cartId) {
    return {
      cartId: null,
      base: 0,
      hasDiscount: false,
      discountAppliedAt: null,
      discountCodeId: null,
    };
  }

  const cart = await prismadb.cart.findUnique({
    where: { id: cartId },
    select: {
      id: true,
      discountCodeId: true,
      discountAppliedAt: true,
      status: true,
    },
  });

  // ✅ base = مبلغ قابل پرداخت قبل از کدتخفیف
  const base = Number(calc?.cart?.totalPrice || 0);

  return {
    cartId,
    base: clampInt(base, 0),
    hasDiscount: Boolean(cart?.discountCodeId),
    discountAppliedAt: cart?.discountAppliedAt,
    discountCodeId: cart?.discountCodeId,
  };
}

/**
 * اعتبارسنجی عمومی کد تخفیف + استفاده قبلی
 */
async function validateDiscountOrThrow({ userId, code }) {
  if (!code) return { ok: false, message: 'کد وارد نشده است.' };

  const discount = await prismadb.discountCode.findUnique({
    where: { code },
    include: {
      course: { select: { id: true } },
      productCategory: { select: { id: true } },
    },
  });

  if (!discount) return { ok: false, message: 'کد تخفیف نامعتبر است.' };

  const now = new Date();

  if (!discount.isActive) return { ok: false, message: 'این کد غیرفعال است.' };

  if (discount.expiryDate && discount.expiryDate <= now)
    return { ok: false, message: 'کد تخفیف منقضی شده است.' };

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit)
    return { ok: false, message: 'سقف استفاده از کد پر شده است.' };

  const usedBefore = await prismadb.userDiscount.findFirst({
    where: { userId, discountCodeId: discount.id },
    select: { id: true },
  });

  if (usedBefore)
    return { ok: false, message: 'قبلاً از این کد استفاده کرده‌اید.' };

  const appliesTo = discount.appliesTo || 'COURSE';

  return { ok: true, discount, appliesTo };
}

/**
 * محاسبه تخفیف با سقف + گاردها
 * خروجی int (تومان)
 */
function computeDiscountAmount({ baseAmount, percent, maxDiscountAmount }) {
  const base = Number(baseAmount || 0);
  if (base <= 0) return 0;

  const p = Number(percent || 0);
  if (!(p > 0)) return 0;

  let amount = Math.floor((base * p) / 100);

  if (maxDiscountAmount != null) {
    amount = Math.min(amount, Number(maxDiscountAmount));
  }

  amount = Math.min(amount, base);

  return clampInt(amount, 0);
}

/**
 * تقسیم تناسبی تخفیف بین دو سبد (برای ALL)
 */
function splitDiscountProportionally(totalDiscount, courseBase, shopBase) {
  const c = Number(courseBase || 0);
  const s = Number(shopBase || 0);
  const totalBase = c + s;
  const td = clampInt(totalDiscount, 0);

  if (td === 0 || totalBase <= 0) return { courseDiscount: 0, shopDiscount: 0 };
  if (c <= 0) return { courseDiscount: 0, shopDiscount: td };
  if (s <= 0) return { courseDiscount: td, shopDiscount: 0 };

  const courseDiscount = Math.floor((td * c) / totalBase);
  const shopDiscount = td - courseDiscount;

  return {
    courseDiscount: Math.min(courseDiscount, c),
    shopDiscount: Math.min(shopDiscount, s),
  };
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ابتدا وارد حساب کاربری شوید.' },
        { status: 401 }
      );
    }

    const { code } = await req.json();
    const userId = user.id;

    // 1) validate discount
    const v = await validateDiscountOrThrow({ userId, code });
    if (!v.ok) {
      return NextResponse.json(
        { success: false, message: v.message },
        { status: 400 }
      );
    }

    const { discount, appliesTo } = v;

    // 2) load both carts base
    const [courseCart, shopCart] = await Promise.all([
      getCourseCartBase(userId),
      getShopCartBase(userId),
    ]);

    // 3) اگر تخفیف قبلاً روی یکی/هر دو اعمال شده باشد
    const anyDiscountApplied = courseCart.hasDiscount || shopCart.hasDiscount;

    if (appliesTo === 'ALL' && anyDiscountApplied) {
      return NextResponse.json(
        {
          success: false,
          message: 'روی یکی از سبدها قبلاً تخفیف اعمال شده است.',
        },
        { status: 400 }
      );
    }

    if (appliesTo === 'COURSE' && courseCart.hasDiscount) {
      return NextResponse.json(
        {
          success: false,
          message: 'روی سبد دوره‌ها قبلاً تخفیف اعمال شده است.',
        },
        { status: 400 }
      );
    }

    if (
      (appliesTo === 'PRODUCT' || appliesTo === 'PRODUCT_CATEGORY') &&
      shopCart.hasDiscount
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'روی سبد محصولات قبلاً تخفیف اعمال شده است.',
        },
        { status: 400 }
      );
    }

    // 4) تعیین base قابل تخفیف + minPurchaseAmount
    const courseBase = clampInt(courseCart.base, 0);
    const shopBase = clampInt(shopCart.base, 0);

    let baseForDiscount = 0;

    if (appliesTo === 'ALL') {
      baseForDiscount = courseBase + shopBase;
    } else if (appliesTo === 'COURSE') {
      // اگر کد فقط برای یک course خاص بود، صرفاً حضورش در سبد را چک می‌کنیم
      if (discount.courseId) {
        const pendingCart = await prismadb.cart.findFirst({
          where: { userId, status: 'PENDING' },
          select: { id: true },
        });

        if (!pendingCart) {
          return NextResponse.json(
            { success: false, message: 'سبد خرید دوره‌ها یافت نشد.' },
            { status: 404 }
          );
        }

        const hasCourse = await prismadb.cartCourse.findFirst({
          where: { cartId: pendingCart.id, courseId: discount.courseId },
          select: { id: true },
        });

        if (!hasCourse) {
          return NextResponse.json(
            {
              success: false,
              message:
                'این کد فقط برای یک دوره خاص است و آن دوره در سبد شما نیست.',
            },
            { status: 400 }
          );
        }
      }

      baseForDiscount = courseBase;
    } else if (appliesTo === 'PRODUCT') {
      baseForDiscount = shopBase;
    } else if (appliesTo === 'PRODUCT_CATEGORY') {
      const catId = discount.productCategoryId;
      if (!catId) {
        return NextResponse.json(
          { success: false, message: 'دسته‌بندی کد تخفیف نامعتبر است.' },
          { status: 400 }
        );
      }
      baseForDiscount = clampInt(shopCart.categoryBaseMap.get(catId) || 0, 0);
    } else {
      return NextResponse.json(
        { success: false, message: 'نوع کد تخفیف نامعتبر است.' },
        { status: 400 }
      );
    }

    if (baseForDiscount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'مبلغ قابل اعمال برای این کد در سبد شما صفر است.',
        },
        { status: 400 }
      );
    }

    if (
      discount.minPurchaseAmount &&
      baseForDiscount < Number(discount.minPurchaseAmount)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'مبلغ سبد کمتر از حداقل لازم برای اعمال این کد است.',
        },
        { status: 400 }
      );
    }

    // 5) محاسبه تخفیف کل
    const totalDiscount = computeDiscountAmount({
      baseAmount: baseForDiscount,
      percent: discount.discountPercent,
      maxDiscountAmount: discount.maxDiscountAmount,
    });

    if (totalDiscount <= 0) {
      return NextResponse.json(
        { success: false, message: 'امکان اعمال این کد تخفیف وجود ندارد.' },
        { status: 400 }
      );
    }

    // 6) مقدار تخفیف هر سبد + ذخیره در DB (با transaction)
    const now = new Date();

    await prismadb.$transaction(async (tx) => {
      // ثبت استفاده کاربر + افزایش usageCount
      await tx.userDiscount.create({
        data: { userId, discountCodeId: discount.id },
      });

      await tx.discountCode.update({
        where: { id: discount.id },
        data: { usageCount: { increment: 1 } },
      });

      if (appliesTo === 'COURSE') {
        if (courseCart.cartId) {
          await tx.cart.update({
            where: { id: courseCart.cartId },
            data: {
              discountCodeId: discount.id,
              discountCodeAmount: totalDiscount,
              discountAppliedAt: now,
            },
          });
        }

        if (shopCart.shopCartId) {
          await tx.shopCart.update({
            where: { id: shopCart.shopCartId },
            data: clearShopCartDiscountData,
          });
        }
      }

      if (appliesTo === 'PRODUCT' || appliesTo === 'PRODUCT_CATEGORY') {
        const shopDiscount = totalDiscount;

        if (shopCart.shopCartId) {
          await tx.shopCart.update({
            where: { id: shopCart.shopCartId },
            data: {
              discountCodeId: discount.id,
              discountCodeAmount: shopDiscount,
              discountAppliedAt: now,
            },
          });
        } else {
          throw new Error('Shop cart not found for product discount.');
        }

        if (courseCart.cartId) {
          await tx.cart.update({
            where: { id: courseCart.cartId },
            data: clearCartDiscountData,
          });
        }
      }

      if (appliesTo === 'ALL') {
        const { courseDiscount, shopDiscount } = splitDiscountProportionally(
          totalDiscount,
          courseBase,
          shopBase
        );

        if (courseCart.cartId) {
          await tx.cart.update({
            where: { id: courseCart.cartId },
            data:
              courseDiscount > 0
                ? {
                    discountCodeId: discount.id,
                    discountCodeAmount: courseDiscount,
                    discountAppliedAt: now,
                  }
                : clearCartDiscountData,
          });
        }

        if (shopCart.shopCartId) {
          await tx.shopCart.update({
            where: { id: shopCart.shopCartId },
            data:
              shopDiscount > 0
                ? {
                    discountCodeId: discount.id,
                    discountCodeAmount: shopDiscount,
                    discountAppliedAt: now,
                  }
                : clearShopCartDiscountData,
          });
        }
      }
    });

    // 7) خروجی نهایی: cart دوره‌ها + shop summary
    const updatedCourse = await buildCartResponse(userId);

    const shopAfter = await prismadb.shopCart.findFirst({
      where: { userId, status: 'PENDING', isActive: true },
      select: {
        id: true,
        discountCodeAmount: true,
      },
    });

    const shopBaseAfter = (await getShopCartBase(userId)).base;
    const shopDiscountAmount = clampInt(shopAfter?.discountCodeAmount || 0, 0);

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت اعمال شد.',
      cart: updatedCourse.cart,
      shop: {
        id: shopAfter?.id ?? null,
        subtotal: shopBaseAfter,
        discountAmount: shopDiscountAmount,
        payable: Math.max(0, shopBaseAfter - shopDiscountAmount),
      },
    });
  } catch (err) {
    console.error('ERROR APPLY DISCOUNT:', err);

    if (String(err?.message || '').includes('Shop cart not found')) {
      return NextResponse.json(
        { success: false, message: 'سبد خرید فروشگاه یافت نشد.' },
        { status: 404 }
      );
    }

    if (
      String(err?.message || '')
        .toLowerCase()
        .includes('unique')
    ) {
      return NextResponse.json(
        { success: false, message: 'قبلاً از این کد استفاده کرده‌اید.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'خطای داخلی سرور.' },
      { status: 500 }
    );
  }
}

// ======================
//   حذف تخفیف منقضی شده
// ======================
export async function PATCH() {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ابتدا وارد شوید.' },
        { status: 401 }
      );
    }

    const userId = user.id;

    const [cart, shopCart] = await Promise.all([
      prismadb.cart.findFirst({
        where: { userId, status: 'PENDING' },
        select: { id: true, discountCodeId: true, discountAppliedAt: true },
      }),
      prismadb.shopCart.findFirst({
        where: { userId, status: 'PENDING', isActive: true },
        select: { id: true, discountCodeId: true, discountAppliedAt: true },
      }),
    ]);

    let cleared = false;

    await prismadb.$transaction(async (tx) => {
      if (cart?.discountCodeId && isExpired(cart.discountAppliedAt)) {
        await tx.cart.update({
          where: { id: cart.id },
          data: clearCartDiscountData,
        });
        cleared = true;
      }

      if (shopCart?.discountCodeId && isExpired(shopCart.discountAppliedAt)) {
        await tx.shopCart.update({
          where: { id: shopCart.id },
          data: clearShopCartDiscountData,
        });
        cleared = true;
      }
    });

    const updatedCourse = await buildCartResponse(userId);

    const shopAfter = await prismadb.shopCart.findFirst({
      where: { userId, status: 'PENDING', isActive: true },
      select: {
        id: true,
        discountCodeAmount: true,
      },
    });

    const shopBaseAfter = (await getShopCartBase(userId)).base;
    const shopDiscountAmount = clampInt(shopAfter?.discountCodeAmount || 0, 0);

    return NextResponse.json({
      success: true,
      message: cleared
        ? 'کد تخفیف منقضی شد و حذف گردید.'
        : 'سبد خرید معتبر است.',
      cart: updatedCourse.cart,
      shop: {
        id: shopAfter?.id ?? null,
        subtotal: shopBaseAfter,
        discountAmount: shopDiscountAmount,
        payable: Math.max(0, shopBaseAfter - shopDiscountAmount),
      },
    });
  } catch (err) {
    console.error('PATCH DISCOUNT ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'خطای داخلی سرور.' },
      { status: 500 }
    );
  }
}
