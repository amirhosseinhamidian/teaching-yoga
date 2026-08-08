/* eslint-disable react/prop-types */

'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';

import Button from '../Ui/Button/Button';
import Modal from '../modules/Modal/Modal';

import { reportClientError } from '@/utils/reportClientError';

import { LuLogIn } from 'react-icons/lu';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const toNumber = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatNumber = (value) => toNumber(value).toLocaleString('fa-IR');

const getFeatureContent = (feature) => {
  if (typeof feature === 'string') {
    return feature;
  }

  if (!feature || typeof feature !== 'object') {
    return '';
  }

  return [feature.label, feature.value].filter(Boolean).join(': ');
};

const SubscriptionsPageClient = ({ plans, subscriptionStatus }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [loadingPlanId, setLoadingPlanId] = useState(null);

  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const safePlans = Array.isArray(plans) ? plans : [];

  const hasActiveSubscription = Boolean(
    subscriptionStatus?.hasActiveSubscription &&
    toNumber(subscriptionStatus?.remainingDays) > 0
  );

  const bestDiscountPlanId = useMemo(() => {
    const planWithBestDiscount = safePlans.reduce((bestPlan, currentPlan) => {
      const currentDiscount = toNumber(currentPlan?.discountAmount);

      const bestDiscount = toNumber(bestPlan?.discountAmount);

      return currentDiscount > bestDiscount ? currentPlan : bestPlan;
    }, null);

    return toNumber(planWithBestDiscount?.discountAmount) > 0
      ? planWithBestDiscount?.id
      : null;
  }, [safePlans]);

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  const handleCheckout = async (planId) => {
    if (loadingPlanId !== null) {
      return;
    }

    try {
      setLoadingPlanId(planId);
      setError('');

      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          planId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setShowLoginModal(true);
        return;
      }

      if (!response.ok || !data?.success) {
        if (response.status >= 500) {
          reportClientError(
            new Error('Subscription checkout API returned a server error'),
            {
              event: 'subscription_checkout_api_failed',
              component: 'SubscriptionsPageClient',
              data: {
                status: response.status,
                planId: Number(planId),
              },
            }
          );
        }

        setError(data?.error || 'خطا در شروع فرایند خرید اشتراک');

        return;
      }

      if (typeof data?.redirectUrl === 'string' && data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      reportClientError(
        new Error('Subscription checkout response did not contain redirectUrl'),
        {
          event: 'subscription_checkout_response_invalid',
          component: 'SubscriptionsPageClient',
          data: {
            planId: Number(planId),
            hasPaymentId: Number.isInteger(data?.paymentId),
          },
        }
      );

      setError('پاسخ درگاه پرداخت معتبر نیست.');
    } catch (checkoutError) {
      reportClientError(checkoutError, {
        event: 'subscription_checkout_network_failed',
        component: 'SubscriptionsPageClient',
        data: {
          planId: Number(planId),
        },
      });

      setError('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoadingPlanId(null);
    }
  };

  if (safePlans.length === 0) {
    return (
      <div className='relative mt-8 overflow-hidden rounded-[28px] border border-black/5 bg-surface-light/70 p-7 text-center shadow-[0_20px_65px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_24px_70px_rgba(0,0,0,0.25)]'>
        <div
          aria-hidden='true'
          className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[70px]'
        />

        <div className='relative mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
          <HiOutlineBookOpen size={32} />
        </div>

        <h2 className='relative mt-5 text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
          در حال حاضر پلن فعالی وجود ندارد
        </h2>

        <p className='relative mx-auto mt-3 max-w-xl text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
          پلن‌های اشتراک جدید پس از آماده‌شدن در همین صفحه نمایش داده خواهند شد.
        </p>
      </div>
    );
  }

  return (
    <div className='mt-10 sm:mt-12'>
      {/* Section heading */}
      <div className='mb-7 flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-right'>
        <div>
          <div className='mb-2 flex items-center justify-center gap-2 text-secondary sm:justify-start'>
            <HiOutlineSparkles size={19} />

            <span className='text-xs font-bold sm:text-sm'>
              انتخاب پلن مناسب
            </span>
          </div>

          <h2 className='text-2xl font-black text-text-light sm:text-3xl dark:text-text-dark'>
            پلن‌های اشتراک سمانه یوگا
          </h2>

          <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
            جزئیات هر پلن را بررسی کن و متناسب با نیازت انتخاب کن.
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className='grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {safePlans.map((plan, index) => {
          const basePrice = toNumber(plan?.price);

          const discount = Math.max(toNumber(plan?.discountAmount), 0);

          const finalPrice = Math.max(basePrice - discount, 0);

          const hasDiscount = discount > 0 && basePrice > 0;

          const discountPercent = hasDiscount
            ? Math.min(Math.round((discount / basePrice) * 100), 100)
            : 0;

          const isBestDiscount = plan.id === bestDiscountPlanId;

          const features = Array.isArray(plan?.features)
            ? plan.features.map(getFeatureContent).filter(Boolean)
            : [];

          const includedCourses = Array.isArray(plan?.planCourses)
            ? plan.planCourses
            : [];

          const isLoading = loadingPlanId === plan.id;

          const isAnyCheckoutLoading = loadingPlanId !== null;

          return (
            <motion.article
              key={plan.id}
              initial={{
                opacity: 0,
                y: 35,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.12,
              }}
              transition={{
                duration: 0.55,
                delay: Math.min(index * 0.09, 0.3),
                ease: 'easeOut',
              }}
              whileHover={{
                y: -8,
              }}
              className={`group relative flex h-full flex-col overflow-hidden rounded-[30px] border bg-surface-light/75 shadow-[0_20px_65px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-500 dark:bg-surface-dark/70 dark:shadow-[0_24px_75px_rgba(0,0,0,0.26)] ${
                isBestDiscount
                  ? 'border-secondary/35 shadow-[0_26px_75px_rgba(38,145,125,0.14)] dark:border-secondary/40'
                  : 'border-black/5 hover:border-secondary/25 dark:border-white/10'
              }`}
            >
              <div
                aria-hidden='true'
                className={`absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                  isBestDiscount ? 'via-secondary' : 'via-secondary/40'
                }`}
              />

              <div
                aria-hidden='true'
                className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[70px] transition-transform duration-500 group-hover:scale-125'
              />

              {isBestDiscount && (
                <div className='absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[10px] font-black text-white shadow-[0_10px_28px_rgba(38,145,125,0.28)]'>
                  <HiOutlineSparkles size={14} />

                  <span>بیشترین تخفیف</span>
                </div>
              )}

              <div className='relative z-10 flex h-full flex-col p-5 sm:p-6'>
                {/* Header */}
                <div className='flex items-start gap-4'>
                  <div className='h-13 w-13 min-w-13 flex items-center justify-center rounded-[18px] bg-secondary/10 text-secondary'>
                    <HiOutlinePlayCircle size={27} />
                  </div>

                  <div className='min-w-0 flex-1'>
                    <p className='text-[10px] font-bold text-secondary'>
                      پلن اشتراک
                    </p>

                    <h3 className='mt-1 text-xl font-black leading-8 text-text-light dark:text-text-dark'>
                      {plan.name}
                    </h3>

                    <p className='mt-1 text-xs font-bold text-subtext-light dark:text-subtext-dark'>
                      {plan.intervalLabel || 'مدت اشتراک'}
                    </p>
                  </div>
                </div>

                {plan.description && (
                  <p className='mt-5 line-clamp-3 min-h-[84px] text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
                    {plan.description}
                  </p>
                )}

                {/* Price */}
                <div className='mt-6 rounded-[24px] border border-black/5 bg-background-light/60 p-5 dark:border-white/10 dark:bg-background-dark/45'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-[11px] text-subtext-light dark:text-subtext-dark'>
                        مبلغ قابل پرداخت
                      </p>

                      <div className='mt-2 flex flex-wrap items-baseline gap-1.5'>
                        {finalPrice === 0 ? (
                          <span className='text-2xl font-black text-secondary sm:text-3xl'>
                            رایگان
                          </span>
                        ) : (
                          <>
                            <span className='font-faNa text-2xl font-black text-secondary sm:text-3xl'>
                              {formatNumber(finalPrice)}
                            </span>

                            <span className='text-xs font-bold text-secondary'>
                              تومان
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {hasDiscount && (
                      <span className='rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-faNa text-[10px] font-black text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'>
                        {discountPercent.toLocaleString('fa-IR')}٪ تخفیف
                      </span>
                    )}
                  </div>

                  {hasDiscount && (
                    <div className='mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3 text-xs dark:border-white/10'>
                      <span className='text-subtext-light dark:text-subtext-dark'>
                        قیمت اصلی
                      </span>

                      <span className='font-faNa text-subtext-light line-through dark:text-subtext-dark'>
                        {formatNumber(basePrice)}
                        تومان
                      </span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <div className='mt-6'>
                    <p className='mb-3 text-xs font-black text-text-light dark:text-text-dark'>
                      ویژگی‌های این اشتراک
                    </p>

                    <ul className='space-y-3'>
                      {features.map((feature, featureIndex) => (
                        <li
                          key={`${plan.id}-feature-${featureIndex}`}
                          className='flex items-start gap-2.5 text-xs leading-6 text-subtext-light dark:text-subtext-dark'
                        >
                          <HiOutlineCheckBadge
                            size={18}
                            className='mt-0.5 shrink-0 text-secondary'
                          />

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Included courses */}
                {includedCourses.length > 0 && (
                  <div className='mt-6 overflow-hidden rounded-[22px] border border-secondary/15 bg-secondary/5 dark:bg-secondary/10'>
                    <div className='flex items-center justify-between gap-3 border-b border-secondary/10 px-4 py-3'>
                      <div className='flex items-center gap-2'>
                        <HiOutlineBookOpen
                          size={19}
                          className='text-secondary'
                        />

                        <p className='text-xs font-black text-text-light dark:text-text-dark'>
                          دوره‌های این پلن
                        </p>
                      </div>

                      <span className='rounded-full bg-secondary/10 px-2 py-1 font-faNa text-[10px] font-bold text-secondary'>
                        {includedCourses.length.toLocaleString('fa-IR')}
                        دوره
                      </span>
                    </div>

                    <ul className='max-h-40 space-y-2 overflow-y-auto px-4 py-3'>
                      {includedCourses.map((planCourse) => (
                        <li
                          key={planCourse.id}
                          className='flex items-start gap-2 text-xs leading-6 text-subtext-light dark:text-subtext-dark'
                        >
                          <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary' />

                          <span>
                            {planCourse.course?.title || 'دوره آموزشی'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action */}
                <div className='mt-auto pt-7'>
                  <Button
                    type='button'
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isAnyCheckoutLoading}
                    shadow
                    className='flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold'
                  >
                    {isLoading ? (
                      <>
                        <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white' />

                        <span>در حال انتقال به پرداخت...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {hasActiveSubscription
                            ? 'افزودن بعد از اشتراک فعلی'
                            : 'خرید این اشتراک'}
                        </span>

                        <HiOutlineArrowLeft
                          size={19}
                          className='transition-transform duration-300 group-hover:-translate-x-1'
                        />
                      </>
                    )}
                  </Button>

                  <p className='mt-3 text-center text-[10px] leading-5 text-subtext-light dark:text-subtext-dark'>
                    با انتخاب این پلن، شرایط و قوانین استفاده از اشتراک را
                    می‌پذیرید.
                  </p>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {error && (
        <div
          role='alert'
          className='mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
        >
          {error}
        </div>
      )}

      {showLoginModal && (
        <Modal
          title='ورود یا ساخت حساب کاربری'
          desc='برای خرید اشتراک ابتدا وارد حساب کاربری خود شوید یا یک حساب جدید بسازید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت‌نام'
          secondaryButtonText='لغو'
        />
      )}
    </div>
  );
};

export default SubscriptionsPageClient;
