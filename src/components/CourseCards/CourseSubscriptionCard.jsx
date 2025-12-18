// components/CourseCards/CourseSubscriptionCard.jsx
'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
import DropDown from '../Ui/DropDown/DropDwon';
import Button from '../Ui/Button/Button';

const CourseSubscriptionCard = ({ courseId, className = '' }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

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
        console.error('[SUBSCRIPTION_PLANS_FETCH_ERROR]', err);
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
    if (!selectedPlanId) return;

    try {
      setCheckoutLoading(true);
      setError('');

      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: selectedPlanId }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('[SUBSCRIPTION_CHECKOUT_ERROR]', data);
        setError(data?.error || 'خطا در شروع فرآیند خرید اشتراک');
        return;
      }

      // اینجا می‌تونی:
      // - ریدایرکت کنی به صفحه پرداخت
      // - یا از data.redirectUrl استفاده کنی (وقتی اضافه‌اش کردی)
      // فعلا فرض می‌کنیم بعدش می‌ری به صفحه پرداخت کلی:
      // window.location.href = `/payment?cartId=${data.cartId}`;

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // اگر redirectUrl هنوز پیاده نشده، حداقل cartId رو لاگ کن
        console.log('Subscription cart created:', data);
        alert('سبد خرید اشتراک ساخته شد، لطفاً پرداخت را تکمیل کنید.');
      }
    } catch (err) {
      console.error('[SUBSCRIPTION_CHECKOUT_EXCEPTION]', err);
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
    </div>
  );
};

CourseSubscriptionCard.propTypes = {
  className: PropTypes.string,
  courseId: PropTypes.number.isRequired,
};

export default CourseSubscriptionCard;
