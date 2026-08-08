'use client';

import React, { useEffect, useMemo } from 'react';

import CourseItemsCard from './CourseItemsCard';
import ShopCartItemsCard from './ShopCartItemsCard';
import DetailOrderCard from './DetailOrderCard';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineInformationCircle,
  HiOutlineShoppingBag,
} from 'react-icons/hi2';

import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';
import MobileCheckoutBar from './MobileCheckoutBar';

export default function CartMain() {
  const { items: courseItems, loading: courseLoading } = useCart();

  const { items: shopItems, loading: shopLoading } = useShopCart();

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

  useEffect(() => {
    document.body.classList.add('has-mobile-checkout-bar');

    return () => {
      document.body.classList.remove('has-mobile-checkout-bar');
    };
  }, []);

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-32 pt-5 sm:px-6 sm:pb-32 sm:pt-7 lg:pb-24'>
        <PageIntro
          eyebrow='سبد خرید'
          title='مرور و تکمیل'
          highlight='سفارش شما'
          description='دوره‌ها و محصولات انتخاب‌شده را بررسی کنید و پس از اطمینان، سفارش خود را تکمیل کنید.'
          visualIcon={HiOutlineShoppingBag}
          variant='compact'
        />

        {loading ? (
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='mt-6 flex min-h-[280px] flex-col items-center justify-center px-5 py-12'
          >
            <span className='h-10 w-10 animate-spin rounded-full border-[3px] border-secondary/20 border-t-secondary' />

            <h2 className='mt-4 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              در حال دریافت سبد خرید...
            </h2>

            <p className='mt-1.5 text-xs text-subtext-light dark:text-subtext-dark'>
              چند لحظه صبر کنید
            </p>
          </SiteCard>
        ) : hasAnyItems ? (
          <>
            <div className='mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_410px] xl:gap-6'>
              {/* Items */}
              <div className='order-2 flex min-w-0 flex-col gap-5 lg:order-1'>
                {hasCourseItems && <CourseItemsCard />}

                {hasShopItems && <ShopCartItemsCard />}
              </div>

              {/* Summary */}
              <div className='order-1 lg:sticky lg:top-24 lg:order-2'>
                <DetailOrderCard />
              </div>
            </div>

            {hasCourseItems && (
              <SiteCard
                variant='glass'
                padding='none'
                radius='md'
                className='mt-5 flex items-start gap-3 px-4 py-4 sm:px-5'
              >
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue/10 text-blue'>
                  <HiOutlineInformationCircle size={21} />
                </span>

                <div>
                  <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                    درباره محاسبه هزینه دوره‌ها
                  </h3>

                  <p className='mt-1.5 text-[10px] leading-6 text-subtext-light sm:text-xs sm:leading-7 dark:text-subtext-dark'>
                    هزینه دوره‌ها براساس ترم‌های آن محاسبه می‌شود. در صورتی که
                    دوره‌هایی با ترم یا ترم‌های مشابه در سبد خرید باشد، هزینه آن
                    یک‌بار محاسبه می‌شود. همچنین اگر ترمی در سبد خرید وجود داشته
                    باشد که قبلاً توسط شما خریداری شده باشد، هزینه آن از دوره
                    جدید کسر خواهد شد.
                  </p>
                </div>
              </SiteCard>
            )}
          </>
        ) : (
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='relative mt-6 overflow-hidden px-5 py-14 text-center sm:py-20'
          >
            <div
              aria-hidden='true'
              className='absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[100px]'
            />

            <div className='relative z-10 mx-auto flex max-w-sm flex-col items-center'>
              <span className='flex h-20 w-20 items-center justify-center rounded-[26px] bg-secondary/10 text-secondary'>
                <HiOutlineShoppingBag size={36} />
              </span>

              <h2 className='mt-5 text-lg font-black text-text-light dark:text-text-dark'>
                سبد خرید شما خالی است
              </h2>

              <p className='mt-2 text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                هنوز دوره یا محصولی برای خرید انتخاب نکرده‌اید.
              </p>
            </div>
          </SiteCard>
        )}
      </div>
      <MobileCheckoutBar />
    </main>
  );
}
