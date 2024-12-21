/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CoursePaymentItem from './CoursePaymentItem';
import Checkbox from '@/components/Ui/Checkbox/Checkbox';
import Link from 'next/link';
import Button from '@/components/Ui/Button/Button';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

async function removeCourseFromCart(courseId) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error:', errorData.message);
      return;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing course from cart:', error);
  }
}

const UserOrderCard = ({ data, className }) => {
  const [cartData, setCartData] = useState(data);
  const [roleCheck, setRoleCheck] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleDeleteItem = async (courseId) => {
    const res = await removeCourseFromCart(courseId);
    if (res.success) {
      // بررسی موفقیت درخواست
      setCartData((prev) => ({
        ...prev,
        courses: prev.courses.filter((course) => course.courseId !== courseId),
      }));
    }
  };
  return (
    <div
      className={`rounded-xl bg-surface-light p-4 sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>سفارش شما</h2>
      {cartData.courses.map((course) => (
        <div key={course.courseId}>
          <CoursePaymentItem
            data={course}
            onDeleteItem={(courseId) => handleDeleteItem(courseId)}
          />
        </div>
      ))}
      <hr className='my-2 border-t border-gray-300 dark:border-gray-700' />
      <div className='my-4 flex items-center justify-between sm:my-6'>
        <h3 className='text-base font-semibold sm:text-lg lg:text-xl'>
          مبلغ قابل پرداخت
        </h3>
        <div className='flex items-baseline gap-1 text-green'>
          <h3 className='text-lg font-bold sm:text-xl lg:text-2xl'>
            {cartData.totalPrice.toLocaleString('fa-IR')}
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
      <Button
        shadow
        disable={paymentLoading}
        className='mt-6 flex w-full items-center justify-center gap-2'
      >
        پرداخت
        {paymentLoading && (
          <AiOutlineLoading3Quarters className='animate-spin' />
        )}
      </Button>
    </div>
  );
};

UserOrderCard.propTypes = {
  data: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default UserOrderCard;
