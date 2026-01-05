/* eslint-disable no-undef */
import React from 'react';
import { headers } from 'next/headers';
import PaymentMain from '@/components/templates/payment/PaymentMain';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/payment`,
    { method: 'GET', headers: headers() }
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

async function fetchCheckoutData() {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/apply-discount-code`,
      {
        method: 'PATCH',
        headers: headers(),
        cache: 'no-store',
      }
    );

    const [cartRes, shopRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`, {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/cart`, {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }),
    ]);

    const cartJson = cartRes.ok ? await cartRes.json() : { cart: null };
    const shopJson = shopRes.ok ? await shopRes.json() : { cart: null };

    return {
      cart: cartJson?.cart || null,
      shopCart: shopJson?.cart || null,
    };
  } catch (err) {
    console.error('Error fetching checkout data:', err);
    return { cart: null, shopCart: null };
  }
}

export default async function PaymentPage() {
  const { cart, shopCart } = await fetchCheckoutData();

  return (
    <>
      <HeaderWrapper />
      <PaymentMain cart={cart} shopCart={shopCart} />
      <Footer />
    </>
  );
}
