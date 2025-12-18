/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React from 'react';
import Footer from '@/components/Footer/Footer';
import PaymentCompleteMain from '@/components/templates/complete-payment/PaymentCompleteMain';
import { headers } from 'next/headers';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata() {
  const defaultSeoData = {
    title: 'نتیجه خرید',
    robots: 'noindex, nofollow',
  };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/complete-payment`,
      {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }
    );

    if (!res.ok) return defaultSeoData;

    const result = await res.json().catch(() => null);
    if (!result?.success || !result?.data) return defaultSeoData;

    const seoData = result.data;

    return {
      title: seoData?.siteTitle || defaultSeoData.title,
      robots: seoData?.robotsTag || defaultSeoData.robots,
    };
  } catch {
    return defaultSeoData;
  }
}

const CompletePaymentPage = async ({ searchParams }) => {
  const token = searchParams?.token ?? null;
  const status = searchParams?.status ?? null;

  return (
    <>
      <HeaderWrapper />
      <PaymentCompleteMain token={token} status={status} />
      <Footer />
    </>
  );
};

export default CompletePaymentPage;
