import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { authOptions } from '../auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';

export async function POST(request) {
  try {
    const { discountCode, cartId, userId } = await request.json();

    // مرحله 1: دریافت اطلاعات کد تخفیف
    const discount = await prismadb.discountCode.findUnique({
      where: { code: discountCode },
    });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: 'کد تخفیف نامعتبر است.' },
        { status: 400 },
      );
    }

    // مرحله 2: بررسی اعتبار کد تخفیف
    const now = new Date();

    if (!discount.isActive) {
      return NextResponse.json(
        { success: false, message: 'این کد تخفیف غیرفعال است.' },
        { status: 400 },
      );
    }

    if (discount.expiryDate && discount.expiryDate <= now) {
      return NextResponse.json(
        { success: false, message: 'کد تخفیف منقضی شده است.' },
        { status: 400 },
      );
    }

    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return NextResponse.json(
        {
          success: false,
          message: 'تعداد استفاده از این کد تخفیف به پایان رسیده است.',
        },
        { status: 400 },
      );
    }

    // مرحله 3: بررسی استفاده قبلی توسط کاربر
    const userDiscountUsage = await prismadb.userDiscount.findFirst({
      where: {
        userId,
        discountCodeId: discount.id,
      },
    });

    if (userDiscountUsage) {
      return NextResponse.json(
        {
          success: false,
          message: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید.',
        },
        { status: 400 },
      );
    }

    const cart = await prismadb.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'سبد خرید پیدا نشد.' },
        { status: 400 },
      );
    }

    // بررسی اینکه آیا کد تخفیف قبلاً اعمال شده است
    if (cart.discountCodeId) {
      return NextResponse.json(
        { message: 'کد تخفیف قبلاً روی سبد خرید اعمال شده است.' },
        { status: 400 },
      );
    }

    if (
      discount.minPurchaseAmount &&
      cart.totalPrice < discount.minPurchaseAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'مبلغ کل سبد خرید کمتر از حداقل مبلغ لازم برای این کد تخفیف است.',
        },
        { status: 400 },
      );
    }

    // مرحله 4: محاسبه مبلغ تخفیف
    let discountAmount =
      ((cart.totalPrice - cart.totalDiscount) * discount.discountPercent) / 100;

    if (discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }
    const totalDiscount = (cart.totalDiscount || 0) + discountAmount;

    // مرحله 5: به‌روزرسانی سبد خرید با آیدی کد تخفیف و تخفیف محاسبه شده
    const updatedCart = await prismadb.cart.update({
      where: { id: cartId },
      data: {
        discountCodeAmount: discountAmount,
        totalDiscount,
        discountCodeId: discount.id, // ثبت آیدی کد تخفیف روی سبد خرید
        discountAppliedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'کد تخفیف با موفقیت اعمال شد.',
      data: updatedCart,
    });
  } catch (error) {
    console.error('خطا در اعمال کد تخفیف:', error);
    return NextResponse.json(
      { success: false, message: 'خطایی در اعمال کد تخفیف رخ داد.' },
      { status: 500 },
    );
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'برای مشاهده سبد خرید باید وارد شوید.' },
        { status: 401 },
      );
    }

    const userId = session.user.userId;
    const cart = await prismadb.cart.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (!cart) {
      return NextResponse.json(
        { message: 'سبد خریدی یافت نشد.' },
        { status: 404 },
      );
    }

    // بررسی مدت‌زمان سپری‌شده از اعمال کد تخفیف
    if (cart.discountCodeId && cart.discountAppliedAt) {
      const now = new Date();
      const discountExpiryTime = 10 * 60 * 1000; // 10 دقیقه
      const timePassed = now - new Date(cart.discountAppliedAt);

      if (timePassed > discountExpiryTime) {
        const totalDiscount = cart.totalDiscount - cart.discountCodeAmount;
        // حذف کد تخفیف و بازگرداندن قیمت‌های اصلی
        await prismadb.cart.update({
          where: { id: cart.id },
          data: {
            discountCodeId: null,
            totalDiscount,
            discountAppliedAt: null,
            discountCodeAmount: null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'کد تخفیف منقضی شده و حذف شد.',
        });
      }
    }

    return NextResponse.json({ success: true, message: 'سبد خرید معتبر است.' });
  } catch (error) {
    console.error('خطا در بررسی سبد خرید:', error);
    return NextResponse.json(
      { message: 'خطایی رخ داده است.' },
      { status: 500 },
    );
  }
}
