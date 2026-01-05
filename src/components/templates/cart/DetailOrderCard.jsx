'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { MdOutlineDiscount } from 'react-icons/md';
import Link from 'next/link';

import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';
import { useCartActions } from '@/hooks/cart/useCartActions';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

export default function DetailOrderCard({ className }) {
  // دوره‌ها
  const {
    cartId,
    items: courseItems,
    totalPrice: coursePayable,
    totalPriceWithoutDiscount: courseTotal,
    totalDiscount: courseDiscount,
    loading: courseLoading,
  } = useCart();

  // محصولات
  const {
    items: shopItems,
    subtotal: shopSubtotal, // ممکنه از API بیاد (فقط fallback)
    discountAmount: shopDiscountAmountFromState, // تخفیف کد (از API)
    payable: shopPayableFromState, // قابل پرداخت محصولات (از API)
    loading: shopLoading,
  } = useShopCart();

  const { applyDiscount } = useCartActions();

  const [discountCode, setDiscountCode] = useState('');
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const loading = courseLoading || shopLoading;

  // آیا چیزی در سبدها هست؟
  const hasCourseItems = useMemo(
    () => Array.isArray(courseItems) && courseItems.length > 0,
    [courseItems]
  );

  const hasShopItems = useMemo(
    () => Array.isArray(shopItems) && shopItems.length > 0,
    [shopItems]
  );

  const hasAnyItems = hasCourseItems || hasShopItems;

  /* ======================
     محصولات: محاسبه دقیق تخفیف خود محصول (Per Item)
     - مبلغ قبل از تخفیف محصول: Σ compareAt*qty (اگر compareAt نبود => unitPrice)
     - مبلغ بعد از تخفیف محصول: Σ unitPrice*qty
     - تخفیف خود محصول: Σ max(0, compareAt - unitPrice) * qty
  ====================== */
  const shopTotals = useMemo(() => {
    const list = Array.isArray(shopItems) ? shopItems : [];
    if (!list.length) {
      return { compareAtTotal: 0, unitTotal: 0, productDiscount: 0 };
    }

    let compareAtTotal = 0;
    let unitTotal = 0;
    let productDiscount = 0;

    for (const item of list) {
      const qty = Math.max(0, Number(item.qty || 0));
      const unitPrice = Math.max(0, Number(item.unitPrice || 0));
      const compareAt = Math.max(
        0,
        item.compareAt != null ? Number(item.compareAt) : 0
      );

      compareAtTotal += (compareAt > 0 ? compareAt : unitPrice) * qty;
      unitTotal += unitPrice * qty;

      if (compareAt > 0 && compareAt > unitPrice) {
        productDiscount += (compareAt - unitPrice) * qty;
      }
    }

    return { compareAtTotal, unitTotal, productDiscount };
  }, [shopItems]);

  const shopTotalCompareAt = shopTotals.compareAtTotal; // مبلغ محصولات (قبل از تخفیف محصول)
  const shopSubtotalSafe = shopTotals.unitTotal; // مبلغ محصولات (بعد از تخفیف محصول)
  const shopProductDiscount = shopTotals.productDiscount; // تخفیف خود محصول

  // قابل پرداخت محصولات (ترجیحاً از API)
  const shopPayable = useMemo(() => {
    if (shopPayableFromState != null) {
      const n = Number(shopPayableFromState || 0);
      return n >= 0 ? n : 0;
    }

    // fallback: اگر payable نیامده، از subtotalSafe - discountAmount استفاده کن
    const code = Math.max(0, Number(shopDiscountAmountFromState || 0));
    return Math.max(0, Number(shopSubtotalSafe || 0) - code);
  }, [shopPayableFromState, shopSubtotalSafe, shopDiscountAmountFromState]);

  // ✅ تخفیف کد محصولات را از اختلاف subtotalSafe و payable به دست می‌آوریم (دقیق)
  const shopCodeDiscount = useMemo(() => {
    const diff = Number(shopSubtotalSafe || 0) - Number(shopPayable || 0);
    return diff > 0 ? diff : 0;
  }, [shopSubtotalSafe, shopPayable]);

  const shopTotalDiscount = useMemo(() => {
    return Number(shopProductDiscount || 0) + Number(shopCodeDiscount || 0);
  }, [shopProductDiscount, shopCodeDiscount]);

  /* ======================
     جمع کل
     - مبلغ کل: (دوره‌ها: courseTotal) + (محصولات: shopTotalCompareAt)
     - تخفیف کل: (دوره‌ها: courseDiscount) + (محصولات: shopTotalDiscount)
     - قابل پرداخت: (دوره‌ها: coursePayable) + (محصولات: shopPayable)
  ====================== */
  const grandTotal = useMemo(() => {
    const c = hasCourseItems ? Number(courseTotal || 0) : 0;
    const s = hasShopItems ? Number(shopTotalCompareAt || 0) : 0;
    return c + s;
  }, [hasCourseItems, courseTotal, hasShopItems, shopTotalCompareAt]);

  const grandDiscount = useMemo(() => {
    const c = hasCourseItems ? Number(courseDiscount || 0) : 0;
    const s = hasShopItems ? Number(shopTotalDiscount || 0) : 0;
    return c + s;
  }, [hasCourseItems, courseDiscount, hasShopItems, shopTotalDiscount]);

  const grandPayable = useMemo(() => {
    const c = hasCourseItems ? Number(coursePayable || 0) : 0;
    const s = hasShopItems ? Number(shopPayable || 0) : 0;
    return c + s;
  }, [hasCourseItems, coursePayable, hasShopItems, shopPayable]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    if (!hasAnyItems) {
      toast.showErrorToast('سبد خرید شما خالی است.');
      return;
    }

    const res = await applyDiscount({ code: discountCode, cartId });

    if (res.meta?.requestStatus === 'fulfilled') {
      toast.showSuccessToast('کد تخفیف با موفقیت اعمال شد');
    } else {
      toast.showErrorToast(res.payload || 'کد تخفیف معتبر نیست');
    }
  };

  const formatPrice = (v) => {
    const n = Number(v || 0);
    return n === 0 ? 'رایگان' : `${n.toLocaleString('fa-IR')} تومان`;
  };

  const formatDiscount = (v) => {
    const n = Number(v || 0);
    return n === 0 ? '-' : `${n.toLocaleString('fa-IR')} تومان`;
  };

  // فقط دوره‌های رایگان و محصولی وجود ندارد
  const onlyFreeCoursesNoShop = useMemo(() => {
    if (!hasCourseItems) return false;
    if (hasShopItems) return false;
    return Number(coursePayable || 0) === 0;
  }, [hasCourseItems, hasShopItems, coursePayable]);

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 shadow sm:p-8 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>جزئیات سفارش</h2>

      {!hasAnyItems ? (
        <div className='rounded-xl bg-foreground-light/35 p-4 text-sm text-subtext-light dark:bg-foreground-dark/35 dark:text-subtext-dark'>
          سبد خرید شما خالی است.
        </div>
      ) : (
        <>
          {/* دوره‌ها */}
          {hasCourseItems && (
            <div className='mb-5 rounded-xl bg-foreground-light/35 p-4 dark:bg-foreground-dark/35'>
              <h3 className='mb-3 text-sm font-semibold'>دوره‌ها</h3>

              <div className='flex justify-between'>
                <span>مبلغ</span>
                <span className='font-faNa'>{formatPrice(courseTotal)}</span>
              </div>

              <div className='mt-2 flex justify-between'>
                <span>تخفیف</span>
                <span className='font-faNa text-red'>
                  {formatDiscount(courseDiscount)}
                </span>
              </div>

              <div className='mt-2 flex justify-between font-bold text-green-light dark:text-green-dark'>
                <span>قابل پرداخت</span>
                <span className='font-faNa'>{formatPrice(coursePayable)}</span>
              </div>
            </div>
          )}

          {/* محصولات */}
          {hasShopItems && (
            <div className='mb-5 rounded-xl bg-foreground-light/35 p-4 dark:bg-foreground-dark/35'>
              <h3 className='mb-3 text-sm font-semibold'>محصولات</h3>

              <div className='flex justify-between'>
                <span>مبلغ</span>
                <span className='font-faNa'>
                  {formatPrice(shopTotalCompareAt)}
                </span>
              </div>

              <div className='mt-2 flex justify-between'>
                <span>تخفیف محصول</span>
                <span className='font-faNa text-red'>
                  {formatDiscount(shopProductDiscount)}
                </span>
              </div>

              <div className='mt-2 flex justify-between'>
                <span>تخفیف کد</span>
                <span className='font-faNa text-red'>
                  {formatDiscount(shopCodeDiscount)}
                </span>
              </div>

              <div className='mt-2 flex justify-between font-bold text-green-light dark:text-green-dark'>
                <span>قابل پرداخت</span>
                <span className='font-faNa'>{formatPrice(shopPayable)}</span>
              </div>
            </div>
          )}

          {/* جمع کل */}
          <div className='rounded-xl border border-foreground-light p-4 dark:border-foreground-dark'>
            <div className='flex justify-between'>
              <span>جمع کل</span>
              <span className='font-faNa'>{formatPrice(grandTotal)}</span>
            </div>

            <div className='mt-2 flex justify-between'>
              <span>جمع تخفیف</span>
              <span className='font-faNa text-red'>
                {formatDiscount(grandDiscount)}
              </span>
            </div>

            <hr className='my-4 border-gray-300 dark:border-gray-700' />

            <div className='flex justify-between font-bold text-green-light dark:text-green-dark'>
              <span>مبلغ قابل پرداخت</span>
              <span className='font-faNa'>{formatPrice(grandPayable)}</span>
            </div>
          </div>
        </>
      )}

      {/* دکمه‌ها */}
      {hasAnyItems && grandPayable !== 0 ? (
        <>
          {/* کد تخفیف */}
          <div className='mx-auto mb-6 mt-8 flex w-full items-center gap-2 sm:flex-wrap sm:gap-4 xl:w-3/4'>
            <div className='relative w-full xs:flex-1'>
              <Input
                value={discountCode}
                onChange={setDiscountCode}
                placeholder='کد تخفیف'
                fontDefault={false}
                className='w-full pr-10'
                isUppercase
              />
              <MdOutlineDiscount
                size={20}
                className='absolute right-2 top-2.5 text-subtext-light dark:text-subtext-dark'
              />
            </div>

            <Button
              shadow
              onClick={handleApplyDiscount}
              isLoading={loading}
              className='text-xs sm:text-sm'
            >
              ثبت
            </Button>
          </div>

          <Link className='flex w-full justify-center' href='/payment'>
            <Button
              className='mb-2 flex w-full items-center justify-center gap-1 sm:mb-4'
              shadow
              isLoading={loading}
            >
              تایید و ادامه پرداخت
            </Button>
          </Link>
        </>
      ) : hasAnyItems && grandPayable === 0 ? (
        <Button className='mt-10 w-full sm:mb-4' shadow isLoading={loading}>
          {onlyFreeCoursesNoShop ? 'افزودن دوره رایگان' : 'تکمیل سفارش رایگان'}
        </Button>
      ) : null}
    </div>
  );
}

DetailOrderCard.propTypes = {
  className: PropTypes.string,
};
