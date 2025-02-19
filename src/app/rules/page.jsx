/* eslint-disable no-undef */
import { getServerSession } from 'next-auth';
import React from 'react';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import RulesContent from '@/components/templates/rules/RulesContent';

export async function generateMetadata() {
  return {
    title: 'قوانین و مقررات | سمانه یوگا',
    description:
      'قوانین و مقررات استفاده از وبسایت آموزشی یوگا و مدیتیشن سمانه برای کاربران و هنرجویان',
    robots: 'noIndex, follow',
    alternates: {
      canonical: 'https://samaneyoga.ir/rules',
    },
  };
}

async function RulePage() {
  const session = await getServerSession(authOptions);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info?rules`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 1, // 2 hours
      },
    },
  );
  if (!res.ok) {
    redirect('/not-found');
  }
  const result = await res.json();

  return (
    <>
      <Header isLogin={session} />
      <RulesContent rules={result.rules} />
      <Footer />
    </>
  );
}

export default RulePage;
