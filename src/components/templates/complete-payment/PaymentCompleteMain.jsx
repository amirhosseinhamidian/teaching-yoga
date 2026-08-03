'use client';

import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { IoBagCheckOutline } from 'react-icons/io5';

import { ImSpinner2 } from 'react-icons/im';

import { useRouter } from 'next/navigation';

import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';

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

        if (!active) {
          return;
        }

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

  return (
    <div className='container'>
      <PageCheckoutTitle icon={IoBagCheckOutline} isSuccess={isSuccessful}>
        {isSuccessful
          ? 'تکمیل خرید'
          : status === 'OK' && loading
            ? 'در حال بررسی پرداخت'
            : 'پرداخت ناموفق'}
      </PageCheckoutTitle>

      {loading ? (
        <div className='my-12 flex h-56 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light dark:bg-surface-dark'>
          <ImSpinner2 size={46} className='animate-spin text-secondary' />

          <p>در حال دریافت اطلاعات پرداخت...</p>
        </div>
      ) : isSuccessful ? (
        <PaymentSuccessfully
          paymentDetails={paymentDetails}

          transactionId={paymentDetails.transactionId}
        />
      ) : (
        <PaymentFailed />
      )}
    </div>
  );
};

PaymentCompleteMain.propTypes = {
  token: PropTypes.string,

  status: PropTypes.string,
};

export default PaymentCompleteMain;
