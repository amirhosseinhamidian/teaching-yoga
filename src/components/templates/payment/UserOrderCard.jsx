'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CoursePaymentItem from './CoursePaymentItem';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Link from 'next/link';
import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const UserOrderCard = ({ data, className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuthUser();

  const [roleCheck, setRoleCheck] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // 🛡 چک اینکه cart اصلا وجود دارد یا نه
  if (!data || !data.courses) {
    return (
      <div
        className={`rounded-xl bg-surface-light p-4 dark:bg-surface-dark ${className}`}
      >
        <h2 className='my-6 text-center text-lg'>سبد خرید شما خالی است.</h2>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!user.firstname || !user.lastname) {
      toast.showErrorToast('لطفا نام و نام خانوادگی خود را ثبت کنید.');
      return;
    }

    if (!roleCheck) {
      toast.showErrorToast(
        'برای پرداخت لازم است قوانین و مقررات را تایید کنید.'
      );
      return;
    }

    if (data.courses.length === 0) {
      toast.showErrorToast('سبد خرید شما خالی است.');
      return;
    }

    try {
      setPaymentLoading(true);

      // 🧩 1) اعتبارسنجی تخفیف قبل از پرداخت
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apply-discount-code`,
        {
          method: 'PATCH',
        }
      );

      // 🧩 2) ارسال درخواست پرداخت
      const payload = {
        amount: data.totalPrice,
        desc: getPaymentDescription(data.courses),
        cartId: data.id,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const json = await response.json();
        if (json.paymentResponse?.paymentUrl) {
          window.location.href = json.paymentResponse.paymentUrl;
        } else {
          toast.showErrorToast('خطای پرداخت: لینک پرداخت وجود ندارد.');
        }
      } else {
        const error = await response.json();
        toast.showErrorToast(error.error || 'خطای درخواست پرداخت.');
      }
    } catch (err) {
      toast.showErrorToast('خطای ناشناخته در پرداخت');
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPaymentDescription = (courses) => {
    const titles = courses.map((c) => c.courseTitle);
    if (titles.length > 1)
      return `پرداخت برای خرید دوره‌های ${titles.slice(0, -1).join('، ')} و ${titles.at(-1)}`;
    return `پرداخت برای خرید دوره ${titles[0]}`;
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-4 shadow sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>سفارش شما</h2>

      {data.courses.map((course) => (
        <div key={course.courseId}>
          <CoursePaymentItem data={course} />
        </div>
      ))}

      <hr className='my-2 border-t border-gray-300 dark:border-gray-700' />

      <div className='my-4 flex items-center justify-between sm:my-6'>
        <h3 className='text-base font-semibold sm:text-lg lg:text-xl'>
          مبلغ قابل پرداخت
        </h3>
        <div className='flex items-baseline gap-1 text-green'>
          <h3 className='text-lg font-bold sm:text-xl lg:text-2xl'>
            {data.totalPrice.toLocaleString('fa-IR')}
          </h3>
          <h5 className='text-2xs sm:text-xs'>تومان</h5>
        </div>
      </div>

      <Checkbox
        label={
          <span className='text-[8px] text-subtext-light md:text-2xs dark:text-subtext-dark'>
            من{' '}
            <Link href='/rules' className='text-blue'>
              شرایط و مقررات
            </Link>{' '}
            سایت را خوانده‌ام و آن را می‌پذیرم.
          </span>
        }
        checked={roleCheck}
        onChange={setRoleCheck}
        color='secondary'
        size='small'
      />

      <div className='flex w-full justify-center'>
        <Button
          shadow
          isLoading={paymentLoading}
          onClick={handlePayment}
          className='mt-6 w-full sm:w-2/3 lg:w-1/2'
        >
          پرداخت
        </Button>
      </div>
    </div>
  );
};

UserOrderCard.propTypes = {
  data: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default UserOrderCard;
