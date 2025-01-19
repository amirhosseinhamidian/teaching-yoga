/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CoursePaymentItem from './CoursePaymentItem';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Link from 'next/link';
import Button from '@/components/Ui/Button/Button';
import { useAuth } from '@/contexts/AuthContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const UserOrderCard = ({ data, className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuth();
  const [roleCheck, setRoleCheck] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const paymentClickHandler = async () => {
    if (!user.firstname || !user.lastname) {
      toast.showErrorToast('لطفا نام و نام خانوادگی خود را ثبت کنید.');
      return;
    }
    if (!roleCheck) {
      toast.showErrorToast(
        'برای پرداخت لازم است قوانین و مقررات را تایید کنید.',
      );
      return;
    }
    try {
      setPaymentLoading(true);
      const payload = {
        amount: data.totalPrice,
        desc: getPaymentDescription(data.courses),
        cartId: data.id,
      };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // هدایت کاربر به صفحه پرداخت
        if (data.paymentResponse?.paymentUrl) {
          window.location.href = data.paymentResponse.paymentUrl;
        }
      } else {
        const errorData = await response.json();
        toast.showErrorToast(errorData.error || 'خطای درخواست پرداخت.');
        console.error('Payment error: ', errorData);
      }
    } catch (error) {
      toast.showErrorToast('خطای ناشناخته در پرداخت');
      console.error('checkout error: ', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPaymentDescription = (courses) => {
    const titles = courses.map((course) => {
      return course.courseTitle;
    });
    if (titles.length > 1) {
      const courseList =
        titles.slice(0, -1).join('، ') + ' و ' + titles[titles.length - 1];
      return `پرداخت برای خرید دوره‌های ${courseList}`;
    } else if (titles.length === 1) {
      return `پرداخت برای خرید دوره ${titles[0]}`;
    }
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
      <div>{/* zarinpal */}</div>
      <div>
        <Checkbox
          label={
            <span className='text-[8px] text-subtext-light md:text-2xs dark:text-subtext-dark'>
              من{' '}
              <Link href='/' className='text-blue'>
                شرایط و مقررات
              </Link>{' '}
              سایت را خوانده ام و آن را می پذیرم.
            </span>
          }
          checked={roleCheck}
          onChange={setRoleCheck}
          color='secondary'
          size='small'
        />
      </div>
      <div className='flex w-full justify-center'>
        <Button
          shadow
          isLoading={paymentLoading}
          onClick={paymentClickHandler}
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
