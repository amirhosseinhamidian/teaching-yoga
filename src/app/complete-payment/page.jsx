/* eslint-disable react/prop-types */
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import PaymentCompleteMain from '@/components/templates/complete-payment/PaymentCompleteMain';

const CompletePaymentPage = async ({ searchParams }) => {
  const session = await getServerSession(authOptions);
  const token = searchParams.token;
  const status = searchParams.status;

  return (
    <>
      <Header isLogin={session} />
      <PaymentCompleteMain token={token} status={status} />
      <Footer />
    </>
  );
};

export default CompletePaymentPage;
