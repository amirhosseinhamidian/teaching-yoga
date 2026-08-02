/* eslint-disable no-undef */
// app/subscriptions/page.jsx
import React from 'react';
import { headers } from 'next/headers';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import SubscriptionsPageClient from '@/components/Subscription/SubscriptionsPageClient';
import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  // درخواست برای اطلاعات سئو
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/subscriptions`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const defaultSeoData = {
    title: 'اشتراک‌ها | سمانه یوگا',
    description: 'خرید اشتراک ماهانه و سالانه دوره‌های یوگا',
    robots: 'index, follow',
    canonical: `https://samaneyoga.ir/subscriptions`,
  };

  if (!res.ok) {
    console.error('Failed to fetch SEO data for subscriptions page.');
    return defaultSeoData;
  }

  const result = await res.json();

  if (!result.success || !result.data) {
    return defaultSeoData;
  }

  const seoData = result.data;

  return {
    title: seoData?.siteTitle || defaultSeoData.title,
    description: seoData?.metaDescription || defaultSeoData.description,
    keywords: seoData?.keywords || '',
    robots: seoData?.robotsTag || defaultSeoData.robots,
    canonical: seoData?.canonicalTag || defaultSeoData.canonical,
    openGraph: {
      siteName: seoData?.ogSiteName || 'سمانه یوگا',

      title: seoData?.ogTitle || seoData?.siteTitle || 'اشتراک‌ها',

      description: seoData?.ogDescription || seoData?.metaDescription || '',

      url: toAbsoluteAppUrl(seoData?.ogUrl || '/subscriptions'),

      images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

      type: 'website',
      locale: 'fa_IR',
    },
  };
}

async function fetchSubscriptionPlans() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/subscription/plans`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 3600, // هر ۱ ساعت رفرش
        },
      }
    );

    if (!res.ok) {
      console.error('Failed to fetch subscription plans');
      return [];
    }

    const plans = await res.json();
    return plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

// 🔹 وضعیت اشتراک فعلی کاربر
async function fetchSubscriptionStatus() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/subscription/status`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 0, // همیشه تازه (چون وابسته به زمان و کاربر است)
        },
      }
    );

    if (!res.ok) {
      console.error('Failed to fetch subscription status');
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return null;
  }
}

export default async function SubscriptionsPage() {
  const [plans, subscriptionStatus] = await Promise.all([
    fetchSubscriptionPlans(),
    fetchSubscriptionStatus(),
  ]);

  const hasActive =
    subscriptionStatus?.hasActiveSubscription &&
    (subscriptionStatus?.remainingDays ?? 0) > 0;

  const remainingDays = subscriptionStatus?.remainingDays ?? 0;

  return (
    <>
      <HeaderWrapper />
      <div className='container py-10'>
        <div className='mb-6'>
          <PageTitle>پلن‌های اشتراک</PageTitle>

          {/* متن عمومی */}
          <p className='mt-2 text-sm text-subtext-light dark:text-subtext-dark'>
            با خرید اشتراک، تا پایان مهلت آن به دوره‌هایی که در هر پلن تعریف
            شده‌اند بدون پرداخت مجدد دسترسی خواهی داشت.
          </p>

          {/* 🔥 پیام راهنما اگر کاربر اشتراک فعال دارد */}
          {hasActive && (
            <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500 dark:bg-amber-900 dark:text-amber-100'>
              <p>
                شما در حال حاضر یک اشتراک فعال دارید و{' '}
                <span className='font-bold'>
                  {remainingDays.toLocaleString('fa-IR')} روز
                </span>{' '}
                تا پایان آن باقی مانده است.
              </p>
              <p className='mt-1'>
                در صورت خرید هر اشتراک جدید، اشتراک تازه پس از پایان اشتراک فعلی
                شما به صورت خودکار فعال خواهد شد و روزهای آن به انتهای اشتراک
                فعلی اضافه می‌شود.
              </p>
            </div>
          )}
        </div>

        <SubscriptionsPageClient
          plans={plans}
          subscriptionStatus={subscriptionStatus}
        />
      </div>
      <Footer />
    </>
  );
}
