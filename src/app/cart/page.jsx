/* eslint-disable no-undef */
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import { getServerSession } from 'next-auth';
import React from 'react';
import { BsHandbag } from 'react-icons/bs';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { headers } from 'next/headers';
import CourseItemsCard from '@/components/templates/cart/CourseItemsCard';
import DetailOrderCard from '@/components/templates/cart/DetailOrderCard';

async function fetchCartData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`, {
    cache: 'no-store', // Ensures SSR by disabling caching
    method: 'GET',
    headers: headers(),
  });

  if (!res.ok) {
    console.error('Failed to fetch course data');
  }

  return res.json();
}

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const cartData = await fetchCartData();
  return (
    <>
      <Header isLogin={session} />
      <div className='container'>
        {cartData.cart ? (
          <>
            <PageCheckoutTitle icon={BsHandbag}>سبد خرید</PageCheckoutTitle>
            <div className='mb-10 mt-4 grid grid-cols-1 gap-10 md:mb-16 md:mt-8 md:grid-cols-2 lg:gap-28'>
              <CourseItemsCard
                data={cartData.cart}
                className='order-last self-start md:order-first'
              />
              <DetailOrderCard
                data={cartData.cart}
                className='order-first self-start md:order-last'
              />
            </div>
          </>
        ) : (
          <div className='my-28 flex min-h-48 w-full flex-col items-center justify-center gap-4 rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
            <BsHandbag size={46} className='text-secondary' />
            <h2 className='text-center text-base font-semibold text-secondary md:text-xl'>
              سبد خرید شما خالی است.
            </h2>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
