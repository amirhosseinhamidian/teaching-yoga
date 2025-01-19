/* eslint-disable no-undef */
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

const PaymentFailed = () => {
  const router = useRouter();

  const handleHomeRedirect = () => {
    router.replace('/');
  };

  return (
    <div className='my-12 flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 xs:p-6 dark:bg-surface-dark'>
      <h2 className='text-center text-base font-semibold text-red xs:text-lg md:text-xl lg:text-2xl'>
        پرداخت شما با شکست مواجه شد
      </h2>
      <p className='text-center font-faNa text-xs text-subtext-light xs:text-sm dark:text-subtext-dark'>
        درصورتی که مبلغ از حساب شما کسر شده باشد ، این مبلغ ظرف کمتر از 24 ساعت
        از طرف بانک به حساب شما عودت داده می شود.
      </p>
      <OutlineButton
        className='text-xs sm:text-base'
        color='secondary'
        onClick={handleHomeRedirect}
      >
        بازگشت به صفحه اصلی
      </OutlineButton>
    </div>
  );
};

export default PaymentFailed;
