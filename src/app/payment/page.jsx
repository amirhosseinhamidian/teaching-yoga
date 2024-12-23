/* eslint-disable no-undef */
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { GoCreditCard } from 'react-icons/go';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import UserInformationCard from '@/components/templates/payment/UserInformationCard';
import UserOrderCard from '@/components/templates/payment/UserOrderCard';
import { headers } from 'next/headers';

async function fetchCartData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
      {
        cache: 'no-store', // Ensures SSR by disabling caching
        method: 'GET',
        headers: headers(),
      },
    );

    if (!res.ok) {
      console.error('Failed to fetch course data');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetch course data:', error);
  }
}

const PaymentPage = async () => {
  const session = await getServerSession(authOptions);
  const cartData = await fetchCartData();

  return (
    <>
      <Header isLogin={session} />
      <div className='container'>
        <PageCheckoutTitle icon={GoCreditCard}>پرداخت</PageCheckoutTitle>
        <div className='mb-10 mt-4 grid grid-cols-1 gap-10 md:mb-16 md:mt-8 md:grid-cols-2 lg:gap-28'>
          <UserInformationCard className='order-last self-start md:order-first' />
          <UserOrderCard
            data={cartData.cart}
            className='order-first self-start md:order-last'
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentPage;
