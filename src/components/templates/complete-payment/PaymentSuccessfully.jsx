/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Button from '@/components/Ui/Button/Button';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const PaymentSuccessfully = ({ courses, transactionId }) => {
  const [shortAddressClick, setShortAddressClick] = useState('');
  const [isClickLoading, setIsClickLoading] = useState(false);
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const handleCourseClick = async (shortAddress) => {
    setShortAddressClick(shortAddress);
    setIsClickLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}/first-session`,
      );
      if (response.ok) {
        const { sessionId } = await response.json();
        router.replace(`/courses/${shortAddress}/lesson/${sessionId}`);
      } else {
        toast.showErrorToast('خطای غیرمنتظره');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsClickLoading(false);
    }
  };
  return (
    <div className='my-12 flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 xs:p-6 dark:bg-surface-dark'>
      <h2 className='text-center text-base font-semibold text-secondary xs:text-lg md:text-xl lg:text-2xl'>
        خرید شما با موفقیت انجام شد
      </h2>
      <h3 className='text-center font-faNa'>کد سفارش: {transactionId}</h3>
      {courses.map((course) => (
        <div
          key={course.id}
          className='flex w-full flex-wrap items-center justify-between gap-2 border-t border-gray-300 py-4 xs:py-6 dark:border-gray-700'
        >
          <div className='flex flex-wrap items-center gap-2'>
            <Image
              src={course.cover}
              alt={course.title}
              width={360}
              height={280}
              className='h-9 w-14 rounded-lg object-cover xs:h-14 xs:w-20 sm:h-20 sm:w-28'
            />
            <h5 className='text-xs sm:text-base'>{course.title}</h5>
          </div>
          <Button
            shadow
            className='flex items-center justify-center text-xs sm:text-base'
            onClick={() => handleCourseClick(course.shortAddress)}
            disable={isClickLoading}
          >
            مشاهده دوره
            {isClickLoading && shortAddressClick === course.shortAddress && (
              <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

PaymentSuccessfully.propTypes = {
  courses: PropTypes.array.isRequired,
  transactionId: PropTypes.number.isRequired,
};

export default PaymentSuccessfully;
