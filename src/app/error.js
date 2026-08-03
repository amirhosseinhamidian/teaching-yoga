'use client';

import { useEffect, React } from 'react';

import ErrorState from '@/components/templates/error-state/ErrorState';

import { reportClientError } from '@/utils/reportClientError';

const ErrorPage = ({ error, reset }) => {
  useEffect(() => {
    reportClientError(error, {
      type: 'react_error_boundary',

      source: 'src/app/error.js',

      digest: error?.digest || null,
    });
  }, [error]);

  return (
    <ErrorState
      code='500'
      variant='server'
      eyebrow='خطای موقت'
      title='در نمایش این صفحه مشکلی پیش آمد'
      description='بخشی از اطلاعات صفحه به‌درستی بارگذاری نشد. چند لحظه بعد دوباره تلاش کنید. اگر مشکل ادامه داشت، از صفحه اصلی وارد بخش موردنظر شوید.'
      retryLabel='تلاش مجدد'
      onRetry={() => reset()}
      primaryHref='/'
      primaryLabel='بازگشت به خانه'
      secondaryHref='/contact-us'
      secondaryLabel='ارتباط با پشتیبانی'
    />
  );
};

export default ErrorPage;
