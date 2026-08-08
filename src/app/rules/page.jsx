/* eslint-disable no-undef */

import React from 'react';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

import RulesContent from '@/components/templates/rules/RulesContent';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata() {
  return {
    title: 'قوانین و مقررات | سمانه یوگا',

    description:
      'قوانین و مقررات استفاده از وبسایت آموزشی یوگا و مدیتیشن سمانه برای کاربران و هنرجویان',

    robots: 'noindex, follow',

    alternates: {
      canonical: 'https://samaneyoga.ir/rules',
    },
  };
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

async function RulePage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info?rules`,
    {
      method: 'GET',

      headers: headers(),

      next: {
        revalidate: 1,
      },
    }
  );

  if (!res.ok) {
    redirect('/not-found');
  }

  const result = await res.json();

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        <PageBackground />

        <RulesContent rules={result?.rules || ''} />
      </main>

      <Footer />
    </>
  );
}

export default RulePage;
