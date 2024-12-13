/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Ui/Button/Button';
import { ImSpinner2 } from 'react-icons/im';
import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const CourseWatchCard = ({ shortAddress, className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoToCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}/first-session`,
      );
      if (response.ok) {
        const { sessionId } = await response.json();
        router.push(`/courses/${shortAddress}/lesson/${sessionId}`);
      } else {
        toast.showErrorToast('خطای غیرمنتظره');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={`mx-auto flex rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
    >
      <div className='my-auto flex min-h-20 w-full flex-wrap items-center justify-center gap-2 lg:justify-between'>
        <h5 className='text-sm text-subtext-light xs:text-base dark:text-subtext-dark'>
          شما شرکت کننده این دوره هستید
        </h5>
        <Button
          onClick={handleGoToCourse}
          disable={loading}
          className='flex items-center'
        >
          ورود به دوره
          {loading && <ImSpinner2 className='mr-2 animate-spin' />}
        </Button>
      </div>
    </div>
  );
};

CourseWatchCard.propTypes = {
  shortAddress: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default CourseWatchCard;
