// components/templates/complete-payment/PaymentCompleteMain.jsx
/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { IoBagCheckOutline } from 'react-icons/io5';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import PaymentSuccessfully from '@/components/templates/complete-payment/PaymentSuccessfully';
import PaymentFailed from '@/components/templates/complete-payment/PaymentFailed';
import { ImSpinner2 } from 'react-icons/im';
import { updateUser } from '@/app/actions/updateUser';
import { useRouter } from 'next/navigation';

async function fetchPaymentDetails(token) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payment-details?token=${token}`,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data?.error || `Failed to fetch payment details: ${res.status}`
    );
  }

  return res.json();
}

const PaymentCompleteMain = ({ token, status }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const fetchDetails = async () => {
    if (!token || isNaN(Number(token))) {
      throw new Error('Invalid token: Token must be a valid number.');
    }
    const data = await fetchPaymentDetails(token);
    setPaymentDetails(data);
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // پرداخت ناموفق
      if (status !== 'OK') {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) setLoading(true);

      try {
        // 1) جزئیات پرداخت
        await fetchDetails();

        // 2) آپدیت یوزر (سرور اکشن)
        // اگر این اکشن کوکی/یوزر رو sync می‌کنه، بعدش باید RSC refresh بشه
        await updateUser();

        // 3) مهم‌ترین بخش برای حل مشکل هدر/لاگین در SSR
        router.refresh();
      } catch (error) {
        console.error('Error fetching details or updating user:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, [token, status, router]);

  return (
    <div className='container'>
      <PageCheckoutTitle icon={IoBagCheckOutline} isSuccess={status === 'OK'}>
        {status === 'OK' ? 'تکمیل خرید' : 'پرداخت ناموفق'}
      </PageCheckoutTitle>

      {loading ? (
        <div className='my-12 flex h-56 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light dark:bg-surface-dark'>
          <ImSpinner2 size={46} className='animate-spin text-secondary' />
          <p>درحال دریافت اطلاعات از درگاه بانک ...</p>
        </div>
      ) : (
        <>
          {status === 'OK' && paymentDetails ? (
            <PaymentSuccessfully
              paymentDetails={paymentDetails}
              transactionId={paymentDetails.transactionId}
            />
          ) : (
            <PaymentFailed />
          )}
        </>
      )}
    </div>
  );
};

PaymentCompleteMain.propTypes = {
  token: PropTypes.string, // ممکنه null هم بیاد
  status: PropTypes.string,
};

export default PaymentCompleteMain;
