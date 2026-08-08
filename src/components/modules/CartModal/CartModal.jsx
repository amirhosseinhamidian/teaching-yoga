/* eslint-disable react/prop-types */
'use client';

import React, { useMemo, useState } from 'react';

import Image from 'next/image';

import { useRouter } from 'next/navigation';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlinePhoto,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineXMark,
} from 'react-icons/hi2';

import { useCart } from '@/hooks/cart/useCart';

import { useShopCart } from '@/hooks/shopCart/useShopCart';

/*
|--------------------------------------------------------------------------
| Image
|--------------------------------------------------------------------------
*/

function CartImage({ src, alt }) {
  const [error, setError] = useState(false);

  return (
    <div className='relative flex h-14 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-background-light/60 dark:border-white/10 dark:bg-background-dark/40'>
      {src && !error ? (
        <Image
          src={src}
          alt={alt || 'تصویر'}
          fill
          sizes='72px'
          className='object-cover'
          onError={() => setError(true)}
        />
      ) : (
        <HiOutlinePhoto size={20} className='text-secondary/40' />
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

export default function CartModal({ onClose }) {
  const router = useRouter();

  const {
    items: courseItems,

    loading: courseLoading,

    totalPrice: coursePayable,
  } = useCart();

  const {
    items: shopItems,

    loading: shopLoading,

    subtotal: shopPayable,
  } = useShopCart();

  const loading = courseLoading || shopLoading;

  const hasCourseItems = Array.isArray(courseItems) && courseItems.length > 0;

  const hasShopItems = Array.isArray(shopItems) && shopItems.length > 0;

  const shopQty = useMemo(() => {
    if (!hasShopItems) {
      return 0;
    }

    return shopItems.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }, [hasShopItems, shopItems]);

  const grandPayable = useMemo(() => {
    const courses = Number(coursePayable || 0);

    const shop = Number(shopPayable || 0);

    return courses + shop;
  }, [coursePayable, shopPayable]);

  const goToPayment = () => {
    router.push('/payment');

    onClose();
  };

  const goToCart = () => {
    router.push('/cart');

    onClose();
  };

  const formatPrice = (value) => {
    const number = Number(value || 0);

    return number === 0 ? 'رایگان' : number.toLocaleString('fa-IR');
  };

  return (
    <div
      className='fixed inset-0 z-50 bg-black/45 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        dir='rtl'
        role='dialog'
        aria-modal='true'
        aria-label='سبد خرید'
        onClick={(event) => event.stopPropagation()}
        className='absolute left-4 top-[68px] flex max-h-[calc(100dvh-90px)] w-[calc(100%-2rem)] max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-white/30 bg-surface-light/95 shadow-[0_28px_85px_rgba(15,23,42,0.26)] backdrop-blur-2xl xs:left-6 sm:left-10 dark:border-white/10 dark:bg-surface-dark/95 dark:shadow-[0_30px_95px_rgba(0,0,0,0.5)]'
      >
        {/* Header */}
        <div className='relative shrink-0 border-b border-black/5 px-4 py-4 dark:border-white/10'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-secondary/10 blur-[65px]'
          />

          <div className='relative z-10 flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <HiOutlineShoppingCart size={22} />
              </span>

              <div>
                <h2 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                  سبد خرید
                </h2>

                <p className='mt-0.5 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                  مرور سریع اقلام انتخاب‌شده
                </p>
              </div>
            </div>

            <button
              type='button'
              aria-label='بستن'
              onClick={onClose}
              className='flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-text-light transition-colors hover:bg-secondary/10 hover:text-secondary dark:bg-white/5 dark:text-text-dark'
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>

          {!loading && (hasCourseItems || hasShopItems) && (
            <div className='relative z-10 mt-3 flex flex-wrap gap-2'>
              {hasCourseItems && (
                <SiteBadge variant='secondary' size='sm'>
                  {courseItems.length.toLocaleString('fa-IR')} دوره
                </SiteBadge>
              )}

              {hasShopItems && (
                <SiteBadge variant='yellow' size='sm'>
                  {shopQty.toLocaleString('fa-IR')} محصول
                </SiteBadge>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className='custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4'>
          {loading ? (
            <div className='flex min-h-[280px] flex-col items-center justify-center gap-3'>
              <span className='h-8 w-8 animate-spin rounded-full border-[3px] border-secondary/20 border-t-secondary' />

              <span className='text-xs font-bold text-subtext-light dark:text-subtext-dark'>
                در حال دریافت سبد خرید...
              </span>
            </div>
          ) : hasCourseItems || hasShopItems ? (
            <div className='space-y-4'>
              {/* Courses */}
              {hasCourseItems && (
                <section>
                  <div className='mb-2 flex items-center gap-2'>
                    <HiOutlineBookOpen size={17} className='text-secondary' />

                    <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                      دوره‌ها
                    </h3>
                  </div>

                  <div className='overflow-hidden rounded-[20px] border border-black/5 bg-background-light/40 dark:border-white/10 dark:bg-background-dark/25'>
                    {courseItems.map((course, index) => (
                      <div
                        key={course.courseId}
                        className={`flex items-center justify-between gap-3 p-3 ${
                          index < courseItems.length - 1
                            ? 'border-b border-black/5 dark:border-white/10'
                            : ''
                        }`}
                      >
                        <div className='flex min-w-0 items-center gap-2.5'>
                          <CartImage
                            src={course.courseCoverImage}
                            alt={course.courseTitle}
                          />

                          <h4 className='line-clamp-2 text-[11px] font-bold leading-5 text-text-light sm:text-xs dark:text-text-dark'>
                            {course.courseTitle}
                          </h4>
                        </div>

                        <div className='shrink-0 text-left'>
                          <strong className='font-faNa text-xs font-black'>
                            {formatPrice(course.finalPrice)}
                          </strong>

                          {Number(course.finalPrice) !== 0 && (
                            <span className='mr-1 text-[8px] text-subtext-light dark:text-subtext-dark'>
                              تومان
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Products */}
              {hasShopItems && (
                <section>
                  <div className='mb-2 flex items-center gap-2'>
                    <HiOutlineShoppingBag
                      size={17}
                      className='text-secondary'
                    />

                    <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                      محصولات
                    </h3>
                  </div>

                  <div className='overflow-hidden rounded-[20px] border border-black/5 bg-background-light/40 dark:border-white/10 dark:bg-background-dark/25'>
                    {shopItems.map((item, index) => {
                      const lineTotal =
                        Number(item.unitPrice || 0) * Number(item.qty || 0);

                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-3 p-3 ${
                            index < shopItems.length - 1
                              ? 'border-b border-black/5 dark:border-white/10'
                              : ''
                          }`}
                        >
                          <div className='flex min-w-0 items-center gap-2.5'>
                            <CartImage
                              src={item.coverImage}
                              alt={item.productTitle}
                            />

                            <div className='min-w-0'>
                              <h4 className='line-clamp-2 text-[11px] font-bold leading-5 text-text-light sm:text-xs dark:text-text-dark'>
                                {item.productTitle}
                              </h4>

                              <div className='mt-1.5 flex flex-wrap gap-1'>
                                <span className='rounded-lg bg-secondary/5 px-2 py-0.5 font-faNa text-[8px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                                  تعداد:{' '}
                                  {Number(item.qty || 0).toLocaleString(
                                    'fa-IR'
                                  )}
                                </span>

                                {item?.color?.name && (
                                  <span className='flex items-center gap-1 rounded-lg bg-secondary/5 px-2 py-0.5 text-[8px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                                    <span>{item.color.name}</span>

                                    {item?.color?.hex && (
                                      <span
                                        className='h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10'
                                        style={{
                                          backgroundColor: item.color.hex,
                                        }}
                                      />
                                    )}
                                  </span>
                                )}

                                {item?.size?.name && (
                                  <span className='rounded-lg bg-secondary/5 px-2 py-0.5 font-faNa text-[8px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                                    سایز: {item.size.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className='shrink-0 text-left'>
                            <strong className='font-faNa text-xs font-black'>
                              {formatPrice(lineTotal)}
                            </strong>

                            {lineTotal !== 0 && (
                              <span className='mr-1 text-[8px] text-subtext-light dark:text-subtext-dark'>
                                تومان
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className='flex min-h-[280px] flex-col items-center justify-center text-center'>
              <span className='flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
                <HiOutlineShoppingCart size={30} />
              </span>

              <h3 className='mt-4 text-sm font-black text-text-light dark:text-text-dark'>
                سبد خرید خالی است
              </h3>

              <p className='mt-1.5 max-w-[240px] text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
                هنوز دوره یا محصولی برای خرید انتخاب نکرده‌اید.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (hasCourseItems || hasShopItems) && (
          <div className='shrink-0 border-t border-black/5 bg-surface-light/90 p-4 dark:border-white/10 dark:bg-surface-dark/90'>
            <div className='mb-4 flex items-end justify-between gap-3'>
              <div>
                <p className='text-[9px] font-bold text-subtext-light dark:text-subtext-dark'>
                  مبلغ قابل پرداخت
                </p>

                <div className='mt-1 flex items-baseline gap-1'>
                  <strong className='font-faNa text-lg font-black'>
                    {formatPrice(grandPayable)}
                  </strong>

                  {grandPayable !== 0 && (
                    <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                      تومان
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <SiteButton
                type='button'
                variant='outline'
                size='md'
                onClick={goToCart}
                className='w-full'
              >
                مشاهده سبد
              </SiteButton>

              {grandPayable !== 0 ? (
                <SiteButton
                  type='button'
                  variant='primary'
                  size='md'
                  endIcon={HiOutlineArrowLeft}
                  onClick={goToPayment}
                  className='w-full'
                >
                  پرداخت
                </SiteButton>
              ) : (
                <SiteButton
                  type='button'
                  variant='primary'
                  size='md'
                  onClick={goToCart}
                  className='w-full'
                >
                  ادامه
                </SiteButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
