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

async function fetchPaymentDetails(token) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/payment-details?token=${token}`
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch payment details: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

const PaymentCompleteMain = ({ token, status }) => {
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);

  const fetchDetails = async () => {
    try {
      if (!token || isNaN(Number(token))) {
        throw new Error('Invalid token: Token must be a valid number.');
      }
      const data = await fetchPaymentDetails(token);
      setPaymentDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'OK') {
        setLoading(true);
        try {
          await fetchDetails();
          await updateUser();
        } catch (error) {
          console.error('Error fetching details or updating user:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, status]);

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
  token: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

export default PaymentCompleteMain;
