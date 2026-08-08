/* eslint-disable no-undef */

import React from 'react';

import { headers } from 'next/headers';

import LoginContent from '@/components/templates/login/LoginContent';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/login`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  const defaultSeoData = {
    title: 'ورود | سمانه یوگا',
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

const Login = () => {
  return <LoginContent />;
};

export default Login;
