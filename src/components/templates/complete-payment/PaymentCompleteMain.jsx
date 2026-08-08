'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';

import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import PaymentSuccessfully from '@/components/templates/complete-payment/PaymentSuccessfully';
import PaymentFailed from '@/components/templates/complete-payment/PaymentFailed';

import { updateUser } from '@/app/actions/updateUser';

const normalizePaymentToken = (value) => {
  const token = typeof value === 'string' ? value.trim() : '';

  if (!/^\d+$/.test(token)) {
    return null;
  }

  return token;
};

const fetchPaymentDetails = async (token, signal) => {
  const response = await fetch(
    `/api/payment-details?token=${encodeURIComponent(token)}`,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data) {
    const error = new Error(data?.error || 'دریافت اطلاعات پرداخت ناموفق بود.');
    error.status = response.status;
    throw error;
  }

  return data;
};

const PaymentCompleteMain = ({ token, status }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const run = async () => {
      if (status !== 'OK') {
        if (active) {
          setLoading(false);
          setLoadFailed(true);
        }
        return;
      }

      const normalizedToken = normalizePaymentToken(token);

      if (!normalizedToken) {
        if (active) {
          setLoading(false);
          setLoadFailed(true);
        }
        return;
      }

      if (active) {
        setLoading(true);
        setLoadFailed(false);
      }

      try {
        const details = await fetchPaymentDetails(
          normalizedToken,
          controller.signal
        );

        if (!active) return;

        setPaymentDetails(details);

        /*
         * شکست Sync کردن Header نباید صفحه نتیجه
         * پرداخت موفق را به حالت ناموفق تبدیل کند.
         */
        try {
          await updateUser();

          if (active) {
            router.refresh();
          }
        } catch {
          // Payment Details با موفقیت دریافت شده است.
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }

        if (active) {
          setPaymentDetails(null);
          setLoadFailed(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, status, router]);

  const isSuccessful =
    status === 'OK' && !loadFailed && Boolean(paymentDetails);

  const introConfig = loading
    ? {
        title: 'در حال',
        highlight: 'بررسی پرداخت',
        description:
          'اطلاعات تراکنش در حال بررسی است. لطفاً چند لحظه منتظر بمانید.',
        icon: HiOutlineArrowPath,
      }
    : isSuccessful
      ? {
          title: 'خرید شما',
          highlight: 'با موفقیت انجام شد',
          description:
            'پرداخت تأیید شد و اطلاعات خرید شما با موفقیت ثبت شده است.',
          icon: HiOutlineCheckCircle,
        }
      : {
          title: 'پرداخت شما',
          highlight: 'ناموفق بود',
          description:
            'پرداخت تکمیل نشد. در صورت کسر وجه، بازگشت مبلغ توسط بانک انجام خواهد شد.',
          icon: HiOutlineXCircle,
        };

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:pb-24'>
        <PageIntro
          eyebrow='نتیجه پرداخت'
          title={introConfig.title}
          highlight={introConfig.highlight}
          description={introConfig.description}
          visualIcon={introConfig.icon}
          variant='compact'
        />

        {loading ? (
          <SiteCard
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='relative mt-6 overflow-hidden px-5 py-14 text-center sm:py-16'
          >
            <div
              aria-hidden='true'
              className='pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[100px]'
            />

            <div className='relative z-10 mx-auto flex max-w-sm flex-col items-center'>
              <span className='flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
                <HiOutlineArrowPath size={30} className='animate-spin' />
              </span>

              <h2 className='mt-4 text-base font-black text-text-light dark:text-text-dark'>
                در حال دریافت اطلاعات پرداخت
              </h2>

              <p className='mt-2 text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                نتیجه تراکنش در حال بررسی است و تا چند لحظه دیگر نمایش داده
                می‌شود.
              </p>
            </div>
          </SiteCard>
        ) : isSuccessful ? (
          <PaymentSuccessfully
            paymentDetails={paymentDetails}
            transactionId={paymentDetails.transactionId}
          />
        ) : (
          <PaymentFailed />
        )}
      </div>
    </main>
  );
};

PaymentCompleteMain.propTypes = {
  token: PropTypes.string,
  status: PropTypes.string,
};

export default PaymentCompleteMain;
