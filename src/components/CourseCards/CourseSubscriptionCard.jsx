'use client';

import React, { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import { usePathname, useRouter } from 'next/navigation';

import DropDown from '../Ui/DropDown/DropDwon';
import Modal from '../modules/Modal/Modal';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import LoadingSpinner from '@/components/SiteUi/Loading/LoadingSpinner';

import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { reportClientError } from '@/utils/reportClientError';

import { LuLogIn } from 'react-icons/lu';
import { PiCrownSimple } from 'react-icons/pi';

const toSafeNumber = (value) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const CourseSubscriptionCard = ({ courseId, className = '' }) => {
  const [plans, setPlans] = useState([]);

  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const [loadingPlans, setLoadingPlans] = useState(true);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [error, setError] = useState('');

  const [showLoginModal, setShowLoginModal] = useState(false);

  const { isAuthenticated } = useAuthUser();

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        setError('');

        const response = await fetch('/api/subscription/plans', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Subscription plans API returned ${response.status}`);
        }

        const result = await response.json();

        const availablePlans = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        const filteredPlans = availablePlans.filter((plan) =>
          plan?.planCourses?.some(
            (item) => Number(item?.courseId) === Number(courseId)
          )
        );

        setPlans(filteredPlans);

        setSelectedPlanId(filteredPlans[0]?.id ?? null);
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        reportClientError(error, {
          event: 'course_subscription_plans_load_failed',

          component: 'CourseSubscriptionCard',

          severity: 'warn',

          data: {
            courseId,
          },
        });

        setError('خطا در دریافت پلن‌های اشتراک');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPlans(false);
        }
      }
    };

    if (courseId) {
      fetchPlans();
    }

    return () => controller.abort();
  }, [courseId]);

  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => Number(plan.id) === Number(selectedPlanId)) || null,

    [plans, selectedPlanId]
  );

  const price = toSafeNumber(selectedPlan?.price);

  const discount = Math.max(toSafeNumber(selectedPlan?.discountAmount), 0);

  const finalPrice = Math.max(price - discount, 0);

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);

    router.push('/login');
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedPlanId) {
      setError('لطفاً یک پلن انتخاب کنید.');

      return;
    }

    try {
      setCheckoutLoading(true);
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
          planId: selectedPlanId,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        setShowLoginModal(true);
        return;
      }

      if (!response.ok || !data?.success) {
        setError(data?.error || 'خطا در شروع فرایند خرید اشتراک');

        return;
      }

      if (typeof data?.redirectUrl === 'string' && data.redirectUrl) {
        window.location.assign(data.redirectUrl);

        return;
      }

      setError('پاسخ درگاه پرداخت معتبر نیست.');
    } catch (error) {
      reportClientError(error, {
        event: 'course_subscription_checkout_network_failed',

        component: 'CourseSubscriptionCard',

        data: {
          courseId,

          planId: selectedPlanId,
        },
      });

      setError('خطا در برقراری ارتباط با سرور');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loadingPlans) {
    return (
      <SiteCard
        variant='yellow'
        padding='sm'
        radius='md'
        className={`flex min-h-[170px] items-center justify-center ${className}`}
      >
        <div className='flex flex-col items-center gap-3'>
          <LoadingSpinner size='md' />

          <span className='text-[10px] text-subtext-light dark:text-subtext-dark'>
            دریافت پلن‌ها...
          </span>
        </div>
      </SiteCard>
    );
  }

  if (!plans.length) {
    return null;
  }

  return (
    <>
      <SiteCard
        variant='yellow'
        padding='sm'
        radius='md'
        className={`flex h-full flex-col ${className}`}
      >
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='text-yellow text-[9px] font-bold'>
              دسترسی چنددوره‌ای
            </p>

            <h2 className='mt-0.5 text-sm font-black text-text-light dark:text-text-dark'>
              خرید اشتراک
            </h2>
          </div>

          <SiteBadge icon={PiCrownSimple} variant='yellow' size='sm'>
            اشتراک
          </SiteBadge>
        </div>

        {plans.length > 1 && (
          <div className='mt-3'>
            <DropDown
              options={plans.map((plan) => ({
                value: plan.id,

                label: plan.name,
              }))}
              value={selectedPlanId ?? undefined}
              onChange={(value) => setSelectedPlanId(Number(value))}
              placeholder='انتخاب پلن'
              fullWidth
            />
          </div>
        )}

        {selectedPlan && (
          <div className='border-yellow/15 mt-3 rounded-xl border bg-surface-light/50 p-3 dark:bg-surface-dark/45'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-xs font-bold text-text-light dark:text-text-dark'>
                {selectedPlan.name}
              </span>

              <div className='shrink-0'>
                {finalPrice === 0 ? (
                  <span className='text-yellow text-sm font-black'>رایگان</span>
                ) : (
                  <>
                    <span className='font-faNa text-base font-black text-text-light dark:text-text-dark'>
                      {finalPrice.toLocaleString('fa-IR')}
                    </span>

                    <span className='mr-1 text-[9px] text-subtext-light dark:text-subtext-dark'>
                      تومان
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className='mt-2 text-[10px] leading-6 text-rose-500'>{error}</p>
        )}

        <SiteButton
          type='button'
          variant='primary'
          size='lg'
          startIcon={PiCrownSimple}
          loading={checkoutLoading}
          disabled={checkoutLoading || !selectedPlanId}
          onClick={handleCheckout}
          fullWidth
          className='mt-3'
        >
          خرید اشتراک
        </SiteButton>
      </SiteCard>

      {showLoginModal && (
        <Modal
          title='ورود یا ساخت حساب کاربری'
          desc='برای تهیه اشتراک ابتدا وارد حساب کاربری خود شوید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت‌نام'
          secondaryButtonText='لغو'
        />
      )}
    </>
  );
};

CourseSubscriptionCard.propTypes = {
  className: PropTypes.string,

  courseId: PropTypes.number.isRequired,
};

export default CourseSubscriptionCard;
