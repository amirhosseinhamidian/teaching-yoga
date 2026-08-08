'use client';

import React, { useMemo } from 'react';

import SiteButton from '@/components/SiteUi/Button/SiteButton';

import { HiOutlineArrowLeft, HiOutlineShoppingCart } from 'react-icons/hi2';

import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';

export default function MobileCheckoutBar() {
  const {
    items: courseItems,
    totalPrice: coursePayable,
    loading: courseLoading,
  } = useCart();

  const {
    items: shopItems,
    subtotal: shopSubtotal,
    discountAmount: shopDiscountAmount,
    payable: shopPayableFromState,
    loading: shopLoading,
  } = useShopCart();

  const hasCourseItems = Array.isArray(courseItems) && courseItems.length > 0;

  const hasShopItems = Array.isArray(shopItems) && shopItems.length > 0;

  const hasAnyItems = hasCourseItems || hasShopItems;

  const loading = courseLoading || shopLoading;

  /*
  |--------------------------------------------------------------------------
  | Shop payable
  |--------------------------------------------------------------------------
  */

  const shopPayable = useMemo(() => {
    if (!hasShopItems) {
      return 0;
    }

    if (shopPayableFromState != null) {
      return Math.max(0, Number(shopPayableFromState || 0));
    }

    const subtotal = Math.max(0, Number(shopSubtotal || 0));

    const discount = Math.max(0, Number(shopDiscountAmount || 0));

    return Math.max(0, subtotal - discount);
  }, [hasShopItems, shopPayableFromState, shopSubtotal, shopDiscountAmount]);

  /*
  |--------------------------------------------------------------------------
  | Final payable
  |--------------------------------------------------------------------------
  */

  const grandPayable = useMemo(() => {
    const courses = hasCourseItems
      ? Math.max(0, Number(coursePayable || 0))
      : 0;

    const shop = hasShopItems ? shopPayable : 0;

    return courses + shop;
  }, [hasCourseItems, hasShopItems, coursePayable, shopPayable]);

  if (loading || !hasAnyItems || grandPayable <= 0) {
    return null;
  }

  return (
    <div
      data-mobile-checkout-bar='true'
      dir='rtl'
      className='fixed inset-x-0 bottom-0 z-40 lg:hidden'
    >
      {/* Gradient separation */}
      <div className='pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background-light/70 to-transparent dark:from-background-dark/70' />

      <div className='border-t border-black/5 bg-surface-light/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_45px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-surface-dark/90 dark:shadow-[0_-16px_50px_rgba(0,0,0,0.30)]'>
        <div className='mx-auto flex max-w-screen-md items-center gap-3'>
          {/* Price */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-1.5'>
              <HiOutlineShoppingCart
                size={15}
                className='shrink-0 text-secondary'
              />

              <span className='text-[9px] font-bold text-subtext-light dark:text-subtext-dark'>
                مجموع قابل پرداخت
              </span>
            </div>

            <div className='mt-1 flex items-baseline gap-1'>
              <strong className='font-faNa text-lg font-black leading-none text-secondary sm:text-xl'>
                {grandPayable.toLocaleString('fa-IR')}
              </strong>

              <span className='shrink-0 text-[9px] font-medium text-subtext-light dark:text-subtext-dark'>
                تومان
              </span>
            </div>
          </div>

          {/* CTA */}
          <SiteButton
            href='/payment'
            variant='primary'
            size='md'
            endIcon={HiOutlineArrowLeft}
            className='min-w-[170px] shrink-0 sm:min-w-[210px]'
          >
            تایید و ادامه پرداخت
          </SiteButton>
        </div>
      </div>
    </div>
  );
}
