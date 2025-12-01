/* eslint-disable no-undef */
import Footer from '@/components/Footer/Footer';
import React from 'react';
import { GoCreditCard } from 'react-icons/go';
import PageCheckoutTitle from '@/components/Ui/PageCheckoutTitle/PageCheckoutTitle';
import UserInformationCard from '@/components/templates/payment/UserInformationCard';
import UserOrderCard from '@/components/templates/payment/UserOrderCard';
import { headers } from 'next/headers';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

/* -----------------------------
 * Metadata SSR
 * ----------------------------- */
export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/payment`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  const defaultSeo = {
    title: 'پرداخت | سمانه یوگا',
    robots: 'noindex, nofollow',
  };

  if (!result.success || !result.data) return defaultSeo;

  return {
    title: result.data.siteTitle || defaultSeo.title,
    robots: result.data.robotsTag || defaultSeo.robots,
  };
}

/* -----------------------------
 * SSR Fetch cart + validate discount
 * ----------------------------- */
async function fetchCartData() {
  try {
    // 1) Validate discount on server
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apply-discount-code`,
      {
        method: 'PATCH',
        headers: headers(),
        cache: 'no-store',
      }
    );

    // 2) Fetch updated cart
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
      {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      console.error('Failed to fetch cart data');
      return { cart: null };
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching cart:', err);
    return { cart: null };
  }
}

/* -----------------------------
 * PAGE
 * ----------------------------- */
export default async function PaymentPage() {
  const cartResponse = await fetchCartData();
  const cart = cartResponse?.cart || null;

  return (
    <>
      <HeaderWrapper />

      <div className='container'>
        <PageCheckoutTitle isSuccess={true} icon={GoCreditCard}>
          پرداخت
        </PageCheckoutTitle>

        <div className='mb-10 mt-4 grid grid-cols-1 gap-10 md:mb-16 md:mt-8 md:grid-cols-2 lg:gap-28'>
          <UserInformationCard className='order-last self-start md:order-first' />

          <UserOrderCard
            data={cart} // 👈 داده محاسبه‌شده SSR
            className='order-first self-start md:order-last'
          />
        </div>
      </div>

      <Footer />
    </>
  );
}
