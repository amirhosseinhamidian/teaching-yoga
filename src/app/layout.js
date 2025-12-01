/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import './globals.css';
import React from 'react';
import { AppProviders } from './providers';
import prismadb from '@/libs/prismadb';
import { getSSRUser } from '@/components/server/HydrateUser';
import ReduxProvider from '@/libs/redux/ReduxProvider';
import UserHydration from '@/components/UserHydration';

export async function generateMetadata() {
  const seoSettings = await prismadb.seoSetting.findMany({
    where: { page: 'general' },
  });

  const seoData = seoSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return {
    title: seoData.siteTitle || 'سمانه یوگا',
    description:
      seoData.metaDescription || 'آموزش حرفه‌ای یوگا و مدیتیشن برای تمام سطوح.',
    keywords: (seoData.keywords || '')
      .split(' ، ')
      .map((keyword) => keyword.replace(/^"|"$/g, ' ')),
    robots: seoData?.robotsTag || 'noindex, nofollow',
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      siteName: seoData.ogSiteName || 'سمانه یوگا',
      title: seoData.ogTitle || 'سمانه یوگا',
      images: [
        {
          url: seoData.ogImage || '/images/hero.png',
          width: 1200,
          height: 630,
          alt: seoData.ogImageAlt || 'لوگوی سمانه یوگا',
        },
      ],
      description:
        seoData.ogDescription || 'آموزش حرفه‌ای یوگا و مدیتیشن برای تمام سطوح.',
      url: seoData.ogUrl || process.env.NEXT_PUBLIC_API_BASE_URL,
      type: 'website',
      local: 'fa_IR',
    },
    alternates: {
      canonical: seoData?.canonicalTag || 'https://samaneyoga.ir',
    },
  };
}

export default async function RootLayout({ children }) {
  const { user } = await getSSRUser();
  return (
    <html lang='fa' dir='rtl'>
      <body className='flex flex-col bg-background-light font-main text-text-light antialiased dark:bg-background-dark dark:text-text-dark'>
        <ReduxProvider>
          <UserHydration user={user} /> {/* این کلاینتی + داخل Redux */}
          <AppProviders>{children}</AppProviders>
        </ReduxProvider>
      </body>
    </html>
  );
}
