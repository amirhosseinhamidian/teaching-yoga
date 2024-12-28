import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { IoBagCheckOutline } from 'react-icons/io5';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import PaymentSuccessfully from '@/components/templates/complete-payment/PaymentSuccessfully';
import PaymentFailed from '@/components/templates/complete-payment/PaymentFailed';

const CompletePaymentPage = async () => {
  const session = await getServerSession(authOptions);
  const courses = [
    {
      id: 1,
      title: 'دوره جامع یوگا',
      cover: '/images/c1.jpg',
      shortAddress: 'yoga-full',
    },
    {
      id: 1,
      title: 'یوگا صورت',
      cover: '/images/c1.jpg',
      shortAddress: 'face-yoga',
    },
  ];
  return (
    <>
      <Header isLogin={session} />
      <div className='container'>
        <PageCheckoutTitle icon={IoBagCheckOutline}>
          تکمیل خرید
        </PageCheckoutTitle>
        {/* <PaymentSuccessfully transactionId={1526612555} courses={courses} /> */}
        <PaymentFailed transactionId={1526612555} />
      </div>
      <Footer />
    </>
  );
};

export default CompletePaymentPage;
