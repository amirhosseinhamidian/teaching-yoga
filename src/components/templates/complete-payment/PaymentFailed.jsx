'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import {
  HiOutlineArrowRight,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
  HiOutlineHome,
} from 'react-icons/hi2';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

const PaymentFailed = () => {
  const router = useRouter();

  const handleHomeRedirect = () => {
    router.replace('/');
  };

  return (
    <div className='mt-6'>
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className='relative overflow-hidden px-5 py-8 sm:px-7 sm:py-10'
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-red/10 blur-[90px]'
        />

        <div className='relative z-10 mx-auto flex max-w-xl flex-col items-center text-center'>
          <span className='flex h-20 w-20 items-center justify-center rounded-[26px] border border-red/15 bg-red/10 text-red shadow-[0_16px_45px_rgba(239,68,68,0.08)]'>
            <HiOutlineExclamationTriangle size={36} />
          </span>

          <h2 className='mt-5 text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
            پرداخت شما با شکست مواجه شد
          </h2>

          <p className='mt-2 max-w-lg text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
            تراکنش تکمیل نشده است. در صورتی که مبلغی از حساب شما کسر شده باشد،
            مبلغ توسط بانک و معمولاً در کمتر از ۲۴ ساعت به حساب شما بازگردانده
            می‌شود.
          </p>

          <div className='mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-2'>
            <div className='flex items-start gap-3 rounded-2xl border border-black/5 bg-background-light/45 p-4 text-right dark:border-white/10 dark:bg-background-dark/30'>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red'>
                <HiOutlineBanknotes size={19} />
              </span>

              <div>
                <p className='text-xs font-black text-text-light dark:text-text-dark'>
                  کسر وجه از حساب
                </p>
                <p className='mt-1 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
                  بازگشت وجه در صورت کسر مبلغ، توسط شبکه بانکی انجام می‌شود.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 rounded-2xl border border-black/5 bg-background-light/45 p-4 text-right dark:border-white/10 dark:bg-background-dark/30'>
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                <HiOutlineArrowRight size={19} />
              </span>

              <div>
                <p className='text-xs font-black text-text-light dark:text-text-dark'>
                  ادامه استفاده از سایت
                </p>
                <p className='mt-1 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
                  می‌توانید به صفحه اصلی برگردید و بعداً دوباره خرید را انجام
                  دهید.
                </p>
              </div>
            </div>
          </div>

          <SiteButton
            type='button'
            variant='primary'
            size='lg'
            startIcon={HiOutlineHome}
            onClick={handleHomeRedirect}
            className='mt-6 w-full sm:w-auto'
          >
            بازگشت به صفحه اصلی
          </SiteButton>
        </div>
      </SiteCard>
    </div>
  );
};

export default PaymentFailed;
