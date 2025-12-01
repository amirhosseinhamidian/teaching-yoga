/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { buildCartResponse } from '@/utils/buildCartResponse';
import { getAuthUser } from '@/utils/getAuthUser';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ابتدا وارد حساب کاربری شوید.' },
        { status: 401 }
      );
    }

    const { code, cartId } = await req.json();
    const userId = user.id;

    if (!code)
      return NextResponse.json(
        { success: false, message: 'کد وارد نشده است.' },
        { status: 400 }
      );

    if (!cartId)
      return NextResponse.json(
        { success: false, message: 'شناسه سبد نامعتبر است.' },
        { status: 400 }
      );

    // ۱) دریافت کد تخفیف
    const discount = await prismadb.discountCode.findUnique({
      where: { code },
    });

    if (!discount)
      return NextResponse.json(
        { success: false, message: 'کد تخفیف نامعتبر است.' },
        { status: 400 }
      );

    const now = new Date();

    if (!discount.isActive)
      return NextResponse.json(
        { success: false, message: 'این کد غیرفعال است.' },
        { status: 400 }
      );

    if (discount.expiryDate && discount.expiryDate <= now)
      return NextResponse.json(
        { success: false, message: 'کد تخفیف منقضی شده است.' },
        { status: 400 }
      );

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit)
      return NextResponse.json(
        { success: false, message: 'سقف استفاده از کد پر شده است.' },
        { status: 400 }
      );

    // ۲) بررسی استفاده قبلی
    const usedBefore = await prismadb.userDiscount.findFirst({
      where: { userId, discountCodeId: discount.id },
    });

    if (usedBefore)
      return NextResponse.json(
        { success: false, message: 'قبلاً از این کد استفاده کرده‌اید.' },
        { status: 400 }
      );

    // ۳) دریافت cart
    const cart = await prismadb.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart)
      return NextResponse.json(
        { success: false, message: 'سبد خرید یافت نشد.' },
        { status: 404 }
      );

    if (cart.discountCodeId)
      return NextResponse.json(
        { success: false, message: 'روی این سبد تخفیف اعمال شده است.' },
        { status: 400 }
      );

    // ۴) محاسبه cart فعلی با helper
    const calc = await buildCartResponse(userId);
    const currentTotal = calc.cart.totalPriceWithoutDiscount;

    if (
      discount.minPurchaseAmount &&
      currentTotal < discount.minPurchaseAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'مبلغ سبد کمتر از حداقل لازم برای اعمال این کد است.',
        },
        { status: 400 }
      );
    }

    // ۵) محاسبه مقدار تخفیف
    let discountAmount = (currentTotal * discount.discountPercent) / 100;

    if (discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }

    // ۶) ذخیره در دیتابیس
    await prismadb.cart.update({
      where: { id: cartId },
      data: {
        discountCodeId: discount.id,
        discountCodeAmount: discountAmount,
        discountAppliedAt: new Date(),
      },
    });

    // ۷) خروجی نهایی — cart کامل
    const updated = await buildCartResponse(userId);

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت اعمال شد.',
      ...updated,
    });
  } catch (err) {
    console.error('ERROR APPLY DISCOUNT:', err);
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

    const cart = await prismadb.cart.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (!cart)
      return NextResponse.json(
        { success: false, message: 'سبد خریدی یافت نشد.' },
        { status: 404 }
      );

    // بررسی ۱۰ دقیقه
    if (cart.discountCodeId && cart.discountAppliedAt) {
      const now = new Date();
      const elapsed = now - new Date(cart.discountAppliedAt);
      const TEN_MIN = 10 * 60 * 1000;

      if (elapsed > TEN_MIN) {
        // حذف تخفیف
        await prismadb.cart.update({
          where: { id: cart.id },
          data: {
            discountCodeId: null,
            discountAppliedAt: null,
            discountCodeAmount: 0,
          },
        });

        const updated = await buildCartResponse(userId);

        return NextResponse.json({
          success: true,
          message: 'کد تخفیف منقضی شد و حذف گردید.',
          ...updated,
        });
      }
    }

    const freshCart = await buildCartResponse(userId);

    return NextResponse.json({
      success: true,
      message: 'سبد خرید معتبر است.',
      ...freshCart,
    });
  } catch (err) {
    console.error('PATCH DISCOUNT ERROR:', err);
    return NextResponse.json(
      { success: false, message: 'خطای داخلی سرور.' },
      { status: 500 }
    );
  }
}
