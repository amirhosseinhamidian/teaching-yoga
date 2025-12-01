/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import Footer from '@/components/Footer/Footer';
import React from 'react';
import PaymentCompleteMain from '@/components/templates/complete-payment/PaymentCompleteMain';
import { headers } from 'next/headers';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/complete-payment`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'نتیجه خرید',
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

const CompletePaymentPage = async ({ searchParams }) => {
  const token = searchParams.token;
  const status = searchParams.status;

  return (
    <>
      <HeaderWrapper />
      <PaymentCompleteMain token={token} status={status} />
      <Footer />
    </>
  );
};

export default CompletePaymentPage;
