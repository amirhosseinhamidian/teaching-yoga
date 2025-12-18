// components/Subscription/SubscriptionsPageClient.jsx
'use client';

import { useState } from 'react';
import React from 'react';
import Button from '../Ui/Button/Button';
import Modal from '../modules/Modal/Modal';
import { LuLogIn } from 'react-icons/lu';
import { usePathname, useRouter } from 'next/navigation';

const SubscriptionsPageClient = ({ plans, subscriptionStatus }) => {
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  if (!plans || plans.length === 0) {
    return (
      <div className='mt-6 rounded-xl bg-surface-light p-6 text-sm shadow dark:bg-surface-dark'>
        در حال حاضر هیچ پلن اشتراکی فعالی ثبت نشده است.
      </div>
    );
  }

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  const handleCheckout = async (planId) => {
    try {
      setLoadingPlanId(planId);
      setError('');

      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setShowLoginModal(true);
        return;
      }

      if (!res.ok) {
        console.error('[SUBSCRIPTION_CHECKOUT_ERROR]', data);
        setError(data?.error || 'خطا در شروع فرآیند خرید اشتراک');
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        console.log('Subscription cart created:', data);
      }
    } catch (err) {
      console.error('[SUBSCRIPTION_CHECKOUT_EXCEPTION]', err);
      setError('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const hasActive =
    subscriptionStatus?.hasActiveSubscription &&
    (subscriptionStatus?.remainingDays ?? 0) > 0;

  return (
    <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {plans.map((plan) => {
        const basePrice = plan.price || 0;
        const discount = plan.discountAmount || 0;
        const finalPrice = Math.max(basePrice - discount, 0);
        const hasDiscount = discount > 0 && finalPrice >= 0;

        const discountPercent =
          hasDiscount && basePrice > 0
            ? Math.round((discount / basePrice) * 100)
            : 0;

        return (
          <div
            key={plan.id}
            className='flex flex-col justify-between rounded-2xl bg-surface-light p-5 shadow dark:bg-surface-dark'
          >
            <div>
              <div className='mb-2 flex items-start justify-between'>
                <h2 className='text-lg font-semibold'>{plan.name}</h2>

                {hasDiscount && (
                  <span className='rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:bg-rose-900 dark:text-rose-100'>
                    {discountPercent > 0
                      ? `${discountPercent.toLocaleString('fa-IR')}٪ تخفیف ویژه`
                      : 'تخفیف ویژه'}
                  </span>
                )}
              </div>

              {plan.description && (
                <p className='mb-3 text-xs leading-relaxed text-subtext-light dark:text-subtext-dark'>
                  {plan.description}
                </p>
              )}

              {/* قیمت‌ها */}
              <div className='mb-3 space-y-1'>
                {hasDiscount && (
                  <div className='flex items-baseline gap-1 text-xs text-slate-500 line-through'>
                    <span>قیمت پایه:</span>
                    <span>{basePrice.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}

                <div className='flex flex-wrap items-baseline gap-1'>
                  <span className='text-xl font-extrabold text-green dark:text-accent'>
                    {finalPrice.toLocaleString('fa-IR')}
                  </span>
                  <span className='text-xs text-green dark:text-accent'>
                    تومان
                  </span>
                  <span className='text-[11px] text-green dark:text-accent'>
                    / {plan.intervalLabel || 'مدت اشتراک'}
                  </span>
                </div>

                {hasDiscount && (
                  <div className='flex items-baseline gap-1 text-sm text-rose-600 dark:text-red'>
                    <span>مبلغ تخفیف:</span>
                    <span className='font-semibold'>
                      {discount.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                )}
              </div>

              {/* ویژگی‌های پلن (features) */}
              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div className='mt-2'>
                  <p className='mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200'>
                    ویژگی‌های این اشتراک:
                  </p>
                  <ul className='space-y-1 text-xs text-slate-600 dark:text-slate-300'>
                    {plan.features.map((item, idx) => (
                      <li key={idx} className='flex gap-1'>
                        {item.label && (
                          <span className='font-semibold'>{item.label}:</span>
                        )}
                        <span className='font-faNa'>{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* دوره‌های شامل این پلن */}
              {plan.planCourses && plan.planCourses.length > 0 && (
                <div className='mt-3 border-t border-slate-300 pt-2 dark:border-slate-700'>
                  <p className='mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200'>
                    دوره‌های شامل این اشتراک:
                  </p>
                  <ul className='max-h-32 list-disc space-y-1 overflow-y-auto pr-4 text-xs text-slate-600 dark:text-slate-300'>
                    {plan.planCourses.map((pc) => (
                      <li key={pc.id}>{pc.course?.title || 'دوره'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* دکمه خرید */}
            <div className='mt-4'>
              <Button
                type='button'
                onClick={() => handleCheckout(plan.id)}
                disabled={loadingPlanId === plan.id}
                shadow
                className='flex w-full items-center justify-center text-sm'
              >
                {loadingPlanId === plan.id
                  ? 'در حال انتقال به پرداخت...'
                  : hasActive
                    ? 'افزودن بعد از پایان اشتراک فعلی'
                    : 'خرید این اشتراک'}
              </Button>
            </div>
          </div>
        );
      })}

      {showLoginModal && (
        <Modal
          title='ثبت نام یا ورود به حساب کاربری'
          desc='برای خرید اشتراک ابتدا وارد حساب کاربری خود شوید یا ثبت نام کنید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت نام'
          secondaryButtonText='لغو'
        />
      )}

      {error && (
        <div className='col-span-full mt-2 rounded-xl border border-red border-opacity-40 bg-red bg-opacity-15 p-3 text-xs text-rose-500'>
          {error}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPageClient;
