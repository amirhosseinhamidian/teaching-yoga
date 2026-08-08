'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Input from '@/components/Ui/Input/Input';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineReceiptPercent,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineTag,
} from 'react-icons/hi2';

import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';
import { useCartActions } from '@/hooks/cart/useCartActions';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

export default function DetailOrderCard({ className }) {
  const {
    cartId,
    items: courseItems,
    totalPrice: coursePayable,
    totalPriceWithoutDiscount: courseTotal,
    totalDiscount: courseDiscount,
    loading: courseLoading,
  } = useCart();

  const {
    items: shopItems,
    subtotal: shopSubtotal,
    discountAmount: shopDiscountAmountFromState,
    payable: shopPayableFromState,
    loading: shopLoading,
  } = useShopCart();

  const { applyDiscount } = useCartActions();

  const [discountCode, setDiscountCode] = useState('');

  const { isDark } = useTheme();

  const toast = createToastHandler(isDark);

  const loading = courseLoading || shopLoading;

  const hasCourseItems = useMemo(
    () => Array.isArray(courseItems) && courseItems.length > 0,
    [courseItems]
  );

  const hasShopItems = useMemo(
    () => Array.isArray(shopItems) && shopItems.length > 0,
    [shopItems]
  );

  const hasAnyItems = hasCourseItems || hasShopItems;

  const shopTotals = useMemo(() => {
    const list = Array.isArray(shopItems) ? shopItems : [];

    if (!list.length) {
      return {
        compareAtTotal: 0,

        unitTotal: 0,

        productDiscount: 0,
      };
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

    return {
      compareAtTotal,
      unitTotal,
      productDiscount,
    };
  }, [shopItems]);

  const shopTotalCompareAt = shopTotals.compareAtTotal;

  const shopSubtotalSafe = shopTotals.unitTotal;

  const shopProductDiscount = shopTotals.productDiscount;

  const shopPayable = useMemo(() => {
    if (shopPayableFromState != null) {
      const number = Number(shopPayableFromState || 0);

      return number >= 0 ? number : 0;
    }

    const code = Math.max(0, Number(shopDiscountAmountFromState || 0));

    return Math.max(0, Number(shopSubtotalSafe || 0) - code);
  }, [shopPayableFromState, shopSubtotalSafe, shopDiscountAmountFromState]);

  const shopCodeDiscount = useMemo(() => {
    const diff = Number(shopSubtotalSafe || 0) - Number(shopPayable || 0);

    return diff > 0 ? diff : 0;
  }, [shopSubtotalSafe, shopPayable]);

  const shopTotalDiscount = useMemo(() => {
    return Number(shopProductDiscount || 0) + Number(shopCodeDiscount || 0);
  }, [shopProductDiscount, shopCodeDiscount]);

  const grandTotal = useMemo(() => {
    const courses = hasCourseItems ? Number(courseTotal || 0) : 0;

    const shop = hasShopItems ? Number(shopTotalCompareAt || 0) : 0;

    return courses + shop;
  }, [hasCourseItems, courseTotal, hasShopItems, shopTotalCompareAt]);

  const grandDiscount = useMemo(() => {
    const courses = hasCourseItems ? Number(courseDiscount || 0) : 0;

    const shop = hasShopItems ? Number(shopTotalDiscount || 0) : 0;

    return courses + shop;
  }, [hasCourseItems, courseDiscount, hasShopItems, shopTotalDiscount]);

  const grandPayable = useMemo(() => {
    const courses = hasCourseItems ? Number(coursePayable || 0) : 0;

    const shop = hasShopItems ? Number(shopPayable || 0) : 0;

    return courses + shop;
  }, [hasCourseItems, coursePayable, hasShopItems, shopPayable]);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      return;
    }

    if (!hasAnyItems) {
      toast.showErrorToast('سبد خرید شما خالی است.');

      return;
    }

    const res = await applyDiscount({
      code: discountCode,

      cartId,
    });

    if (res.meta?.requestStatus === 'fulfilled') {
      toast.showSuccessToast('کد تخفیف با موفقیت اعمال شد');
    } else {
      toast.showErrorToast(res.payload || 'کد تخفیف معتبر نیست');
    }
  };

  const formatPrice = (value) => {
    const number = Number(value || 0);

    return number === 0 ? 'رایگان' : `${number.toLocaleString('fa-IR')} تومان`;
  };

  const formatDiscount = (value) => {
    const number = Number(value || 0);

    return number === 0 ? '-' : `${number.toLocaleString('fa-IR')} تومان`;
  };

  const onlyFreeCoursesNoShop = useMemo(() => {
    if (!hasCourseItems) {
      return false;
    }

    if (hasShopItems) {
      return false;
    }

    return Number(coursePayable || 0) === 0;
  }, [hasCourseItems, hasShopItems, coursePayable]);

  return (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`relative overflow-hidden p-5 sm:p-6 ${className || ''}`}
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-secondary/10 blur-[85px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-5 flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
          <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineReceiptPercent size={22} />
          </span>

          <div>
            <p className='text-[9px] font-bold text-secondary'>خلاصه خرید</p>

            <h2 className='mt-0.5 text-base font-black text-text-light dark:text-text-dark'>
              جزئیات سفارش
            </h2>
          </div>
        </div>

        {!hasAnyItems ? (
          <div className='rounded-2xl bg-background-light/50 p-4 text-xs text-subtext-light dark:bg-background-dark/30 dark:text-subtext-dark'>
            سبد خرید شما خالی است.
          </div>
        ) : (
          <div className='space-y-3'>
            {/* Courses */}
            {hasCourseItems && (
              <div className='rounded-[20px] border border-black/5 bg-background-light/45 p-4 dark:border-white/10 dark:bg-background-dark/30'>
                <div className='mb-3 flex items-center gap-2'>
                  <HiOutlineAcademicCap size={17} className='text-secondary' />

                  <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                    دوره‌ها
                  </h3>
                </div>

                <div className='space-y-2.5 text-[10px] sm:text-xs'>
                  <div className='flex justify-between gap-3 text-subtext-light dark:text-subtext-dark'>
                    <span>مبلغ</span>

                    <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                      {formatPrice(courseTotal)}
                    </span>
                  </div>

                  <div className='flex justify-between gap-3 text-subtext-light dark:text-subtext-dark'>
                    <span>تخفیف</span>

                    <span className='font-faNa font-bold text-red'>
                      {formatDiscount(courseDiscount)}
                    </span>
                  </div>

                  <div className='flex justify-between gap-3 border-t border-black/5 pt-2.5 font-black dark:border-white/10'>
                    <span className='text-text-light dark:text-text-dark'>
                      قابل پرداخت
                    </span>

                    <span className='font-faNa text-secondary'>
                      {formatPrice(coursePayable)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {hasShopItems && (
              <div className='rounded-[20px] border border-black/5 bg-background-light/45 p-4 dark:border-white/10 dark:bg-background-dark/30'>
                <div className='mb-3 flex items-center gap-2'>
                  <HiOutlineShoppingBag size={17} className='text-secondary' />

                  <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                    محصولات
                  </h3>
                </div>

                <div className='space-y-2.5 text-[10px] sm:text-xs'>
                  <div className='flex justify-between gap-3 text-subtext-light dark:text-subtext-dark'>
                    <span>مبلغ</span>

                    <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                      {formatPrice(shopTotalCompareAt)}
                    </span>
                  </div>

                  <div className='flex justify-between gap-3 text-subtext-light dark:text-subtext-dark'>
                    <span>تخفیف محصول</span>

                    <span className='font-faNa font-bold text-red'>
                      {formatDiscount(shopProductDiscount)}
                    </span>
                  </div>

                  <div className='flex justify-between gap-3 text-subtext-light dark:text-subtext-dark'>
                    <span>تخفیف کد</span>

                    <span className='font-faNa font-bold text-red'>
                      {formatDiscount(shopCodeDiscount)}
                    </span>
                  </div>

                  <div className='flex justify-between gap-3 border-t border-black/5 pt-2.5 font-black dark:border-white/10'>
                    <span className='text-text-light dark:text-text-dark'>
                      قابل پرداخت
                    </span>

                    <span className='font-faNa text-secondary'>
                      {formatPrice(shopPayable)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grand total */}
            <div className='relative overflow-hidden rounded-[22px] border border-secondary/15 bg-secondary/[0.06] p-4 dark:bg-secondary/[0.09]'>
              <HiOutlineSparkles
                size={80}
                className='pointer-events-none absolute -left-4 -top-4 text-secondary/[0.05]'
              />

              <div className='relative z-10 space-y-3'>
                <div className='flex justify-between gap-3 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                  <span>جمع کل</span>

                  <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <div className='flex justify-between gap-3 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                  <span>جمع تخفیف</span>

                  <span className='font-faNa font-bold text-red'>
                    {formatDiscount(grandDiscount)}
                  </span>
                </div>

                <div className='h-px bg-secondary/15' />

                <div className='flex items-end justify-between gap-3'>
                  <span className='text-xs font-black text-text-light dark:text-text-dark'>
                    مبلغ قابل پرداخت
                  </span>

                  <strong className='font-faNa text-base font-black text-secondary sm:text-lg'>
                    {formatPrice(grandPayable)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discount */}
        {hasAnyItems && grandPayable !== 0 && (
          <div className='mt-5'>
            <label className='mb-2 flex items-center gap-1.5 text-[10px] font-black text-text-light dark:text-text-dark'>
              <HiOutlineTag size={15} className='text-secondary' />
              کد تخفیف
            </label>

            <div className='flex items-center gap-2'>
              <div className='min-w-0 flex-1'>
                <Input
                  value={discountCode}
                  onChange={setDiscountCode}
                  placeholder='کد تخفیف'
                  fontDefault={false}
                  className='w-full'
                  isUppercase
                />
              </div>

              <SiteButton
                type='button'
                variant='outline'
                size='md'
                disabled={loading}
                onClick={handleApplyDiscount}
              >
                ثبت
              </SiteButton>
            </div>
          </div>
        )}

        {/* CTA */}
        {hasAnyItems && grandPayable !== 0 ? (
          <SiteButton
            href='/payment'
            variant='primary'
            size='lg'
            endIcon={HiOutlineArrowLeft}
            className='mt-5 w-full'
          >
            تایید و ادامه پرداخت
          </SiteButton>
        ) : hasAnyItems && grandPayable === 0 ? (
          <SiteButton
            type='button'
            variant='primary'
            size='lg'
            disabled={loading}
            className='mt-5 w-full'
          >
            {onlyFreeCoursesNoShop
              ? 'افزودن دوره رایگان'
              : 'تکمیل سفارش رایگان'}
          </SiteButton>
        ) : null}
      </div>
    </SiteCard>
  );
}

DetailOrderCard.propTypes = {
  className: PropTypes.string,
};
