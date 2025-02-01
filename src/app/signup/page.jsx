/* eslint-disable no-undef */
import SignupContent from '@/components/templates/signup/SignupContent';
import { headers } from 'next/headers';
import React from 'react';
export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/signup`,
    {
      method: 'GET',
      headers: headers(),
    },
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'ثبت نام | سمانه یوگا',
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

const Page = () => {
  return (
    <>
      <SignupContent />
    </>
  );
};

export default Page;
