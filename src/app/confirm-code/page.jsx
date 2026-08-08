/* eslint-disable no-undef */

import React from 'react';
import { headers } from 'next/headers';

import ConfirmCodeContent from '@/components/templates/confirm-code/ConfirmCodeContent';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/confirm-code`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  const defaultSeoData = {
    title: 'کد تایید | سمانه یوگا',
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

const ConfirmCodePage = () => {
  return <ConfirmCodeContent />;
};

export default ConfirmCodePage;
