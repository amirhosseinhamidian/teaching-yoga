/* eslint-disable no-undef */

import React from 'react';
import { headers } from 'next/headers';

import SignupContent from '@/components/templates/signup/SignupContent';

export async function generateMetadata() {
  const defaultSeoData = {
    title: 'ثبت نام | سمانه یوگا',
    robots: 'noindex, nofollow',
  };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/signup`,
      {
        method: 'GET',
        headers: headers(),
      }
    );

    const result = await res.json();

    if (!result.success || !result.data) {
      return defaultSeoData;
    }

    const seoData = result.data;

    return {
      title: seoData?.siteTitle || defaultSeoData.title,
      robots: seoData?.robotsTag || defaultSeoData.robots,
    };
  } catch (error) {
    console.error('[SIGNUP_METADATA_ERROR]', error);

    return defaultSeoData;
  }
}

const Page = () => {
  return <SignupContent />;
};

export default Page;
