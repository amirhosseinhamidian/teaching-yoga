/* eslint-disable no-undef */
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import AccessDeniedView from '@/components/templates/access-denied/AccessDeniedView';
import { headers } from 'next/headers';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/access-denied`,
    {
      method: 'GET',
      headers: headers(),
    },
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'دسترسی غیر مجاز',
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

async function AccessDeniedPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <Header isLogin={session} />
      <AccessDeniedView />
      <Footer />
    </div>
  );
}

export default AccessDeniedPage;
