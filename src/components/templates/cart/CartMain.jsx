'use client';

import React, { useMemo } from 'react';

import CourseItemsCard from './CourseItemsCard';
import ShopCartItemsCard from './ShopCartItemsCard';
import DetailOrderCard from './DetailOrderCard';

import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import { GoAlert } from 'react-icons/go';
import { BsHandbag } from 'react-icons/bs';
import { ImSpinner2 } from 'react-icons/im';

import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';

export default function CartMain() {
  // دوره‌ها
  const { items: courseItems, loading: courseLoading } = useCart();

  // محصولات
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

  if (loading) {
    return (
      <div className='my-28 flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
        <ImSpinner2 size={46} className='animate-spin text-secondary' />
        <h2 className='text-center text-base font-semibold text-secondary md:text-xl'>
          در حال دریافت اطلاعات سبد خرید...
        </h2>
      </div>
    );
  }

  return (
    <div className='container'>
      {hasAnyItems ? (
        <>
          <PageCheckoutTitle isSuccess={true} icon={BsHandbag}>
            سبد خرید
          </PageCheckoutTitle>

          <div className='mb-5 mt-4 grid grid-cols-1 gap-10 md:mb-8 md:mt-8 md:grid-cols-2 lg:gap-28'>
            {/* لیست آیتم‌ها */}
            <div className='order-last flex flex-col gap-6 self-start md:order-first'>
              {hasCourseItems && <CourseItemsCard />}
              {hasShopItems && <ShopCartItemsCard />}
            </div>

            {/* بخش پرداخت + کد تخفیف */}
            <DetailOrderCard className='order-first self-start md:order-last' />
          </div>

          {/* پیام آموزشی فقط وقتی دوره داخل سبد هست */}
          {hasCourseItems && (
            <div className='mb-10 flex items-start gap-1 text-blue md:mb-16'>
              <GoAlert size={56} className='ml-2 min-h-6 min-w-6' />
              <p className='text-xs'>
                هزینه دوره‌ها براساس ترم‌های آن محاسبه می‌شود. در صورتی که
                دوره‌هایی با ترم یا ترم‌های مشابه در سبد خرید باشد، هزینه آن
                یک‌بار محاسبه می‌شود. همچنین اگر ترمی در سبد خرید وجود داشته
                باشد که قبلاً توسط شما خریداری شده باشد، هزینه آن از دوره جدید
                کسر خواهد شد.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className='my-28 flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
          <BsHandbag size={46} className='text-secondary' />
          <h2 className='text-center text-base font-semibold text-secondary md:text-xl'>
            سبد خرید شما خالی است.
          </h2>
        </div>
      )}
    </div>
  );
}
