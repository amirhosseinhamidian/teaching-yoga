/* eslint-disable react/prop-types */

'use client';

import React, { useEffect } from 'react';

import ErrorState from '@/components/templates/error-state/ErrorState';

import { reportClientError } from '@/utils/reportClientError';

const GlobalError = ({ error, reset }) => {
  useEffect(() => {
    reportClientError(error, {
      type: 'global_error_boundary',

      source: 'src/app/global-error.js',

      digest: error?.digest || null,
    });
  }, [error]);

  return (
    <html lang='fa' dir='rtl'>
      <body className='m-0 min-h-screen bg-background-light text-text-light dark:bg-background-dark dark:text-text-dark'>
        <ErrorState
          code='500'
          variant='server'
          eyebrow='خطای موقت'
          title='مشکلی در اجرای سایت پیش آمد'
          description='در حال حاضر امکان نمایش کامل سایت وجود ندارد. چند لحظه بعد دوباره تلاش کنید. اگر مشکل ادامه داشت، می‌توانید از صفحه اصلی دوباره وارد سایت شوید.'
          retryLabel='تلاش مجدد'
          onRetry={() => reset()}
          primaryHref='/'
          primaryLabel='بازگشت به خانه'
          secondaryHref='/contact-us'
          secondaryLabel='ارتباط با پشتیبانی'
          showBackButton={false}
          fullScreen
        />
      </body>
    </html>
  );
};

export default GlobalError;
