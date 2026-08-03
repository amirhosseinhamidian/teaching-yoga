// components/CourseCards/CourseSubscriptionCard.jsx
'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import DropDown from '../Ui/DropDown/DropDwon';
import Button from '../Ui/Button/Button';
import { LuLogIn } from 'react-icons/lu';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { usePathname, useRouter } from 'next/navigation';
import Modal from '../modules/Modal/Modal';
import { reportClientError } from '@/utils/reportClientError';

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
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        setError('');

        const res = await fetch('/api/subscription/plans', {
          method: 'GET',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch subscription plans');
        }

        const data = await res.json();

        // فقط پلن‌هایی که این دوره داخلشونه
        const filtered = (data || []).filter((plan) =>
          plan.planCourses?.some((pc) => pc.courseId === courseId)
        );

        setPlans(filtered);
        if (filtered.length > 0) {
          setSelectedPlanId(filtered[0].id);
        }
      } catch (err) {
        reportClientError(error, {
          event: 'course_subscription_plans_load_failed',
          component: 'CourseSubscriptionCard',
          severity: 'warn',
          data: {
            courseId,
          },
        });

        setError('خطا در دریافت اطلاعات اشتراک');
      } finally {
        setLoadingPlans(false);
      }
    };

    if (courseId) {
      fetchPlans();
    }
  }, [courseId]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);

      return;
    }

    if (!selectedPlanId) {
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
        if (response.status >= 500) {
          reportClientError(
            new Error(
              'Course subscription checkout API returned a server error'
            ),
            {
              event: 'course_subscription_checkout_api_failed',

              component: 'CourseSubscriptionCard',

              data: {
                status: response.status,

                courseId,

                planId: selectedPlanId,
              },
            }
          );
        }

        setError(data?.error || 'خطا در شروع فرآیند خرید اشتراک');

        return;
      }

      if (typeof data.redirectUrl === 'string' && data.redirectUrl) {
        window.location.assign(data.redirectUrl);

        return;
      }

      reportClientError(
        new Error(
          'Course subscription checkout response did not contain redirectUrl'
        ),
        {
          event: 'course_subscription_checkout_response_invalid',

          component: 'CourseSubscriptionCard',

          data: {
            courseId,

            planId: selectedPlanId,

            hasPaymentId: Number.isInteger(data?.paymentId),
          },
        }
      );

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
      <div
        className={`m-auto rounded-xl bg-surface-light p-4 text-sm dark:bg-surface-dark ${className}`}
      >
        در حال بارگذاری پلن‌های اشتراک...
      </div>
    );
  }

  // اگر هیچ پلنی برای این دوره تعریف نشده، چیزی نشون نده
  if (!plans.length) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  return (
    <div
      className={`flex flex-col justify-between gap-4 rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
    >
      <span className='mr-4 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
        دسترسی با اشتراک
      </span>
      {selectedPlan && plans.length === 1 && (
        <span className='text-sm font-bold xs:text-base'>
          {selectedPlan.name} • {selectedPlan.price.toLocaleString('fa-IR')}{' '}
          تومان
        </span>
      )}
      {plans.length > 1 && (
        <DropDown
          options={plans.map((plan) => ({
            value: plan.id,
            label: `${plan.name} - ${plan.price.toLocaleString('fa-IR')} تومان`,
          }))}
          // اگر selectedPlanId نداشتیم، undefined بدیم تا placeholder نمایش داده بشه
          value={selectedPlanId ?? undefined}
          onChange={(val) => setSelectedPlanId(Number(val))}
          placeholder='یک پلن را انتخاب کنید'
          fullWidth
          className='mt-3 font-bold'
          valueClassName='font-bold'
        />
      )}
      <p className='text-[11px] leading-relaxed text-subtext-light dark:text-subtext-dark'>
        با خرید اشتراک، تا پایان مهلت آن به این دوره و سایر دوره‌های داخل همان
        پلن، بدون پرداخت مجدد دسترسی خواهید داشت.
      </p>

      <Button
        shadow
        onClick={handleCheckout}
        disabled={checkoutLoading || !selectedPlanId}
        className='text-xs xs:text-base'
      >
        {checkoutLoading ? 'انتقال به پرداخت...' : 'خرید اشتراک'}
      </Button>

      {showLoginModal && (
        <Modal
          title='ثبت نام یا ورود به حساب کاربری'
          desc='برای تهیه اشتراک لطفا ابتدا وارد حساب کاربری خود شوید یا در سایت ثبت نام کنید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت نام'
          secondaryButtonText='لغو'
        />
      )}
    </div>
  );
};

CourseSubscriptionCard.propTypes = {
  className: PropTypes.string,
  courseId: PropTypes.number.isRequired,
};

export default CourseSubscriptionCard;
