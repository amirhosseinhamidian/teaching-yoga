/* eslint-disable no-undef */
import Footer from '@/components/Footer/Footer';
import React from 'react';
import CartMain from '@/components/templates/cart/CartMain';
import { headers } from 'next/headers';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/cart`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'سبد خرید | سمانه یوگا',
    robots: 'noindex, nofollow',
  };

  if (!result.success || !result.data) {
    return defaultSeoData;
  }

  const seoData = result.data;

  return {
    title: seoData?.siteTitle || defaultSeoData.title,
    robots: seoData?.robotsTag || defaultSeoData.robots,
  };
}

export default async function CartPage() {
  return (
    <>
      <HeaderWrapper />
      <CartMain />
      <Footer />
    </>
  );
}
