/* eslint-disable no-undef */

import React from 'react';
import { headers } from 'next/headers';

import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';
import SubscriptionsPageClient from '@/components/Subscription/SubscriptionsPageClient';

import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

import {
  HiOutlineAcademicCap,
  HiOutlineCheckBadge,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

export const dynamic = 'force-dynamic';

const defaultSeoData = {
  title: 'اشتراک‌ها | سمانه یوگا',
  description:
    'خرید اشتراک دوره‌های یوگا و مدیتیشن و دسترسی به آموزش‌های سمانه یوگا',
  robots: 'index, follow',
  canonical: 'https://samaneyoga.ir/subscriptions',
};

export async function generateMetadata() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/subscriptions`,
      {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return {
        title: defaultSeoData.title,
        description: defaultSeoData.description,
        robots: defaultSeoData.robots,
        alternates: {
          canonical: defaultSeoData.canonical,
        },
      };
    }

    const result = await response.json();

    if (!result?.success || !result?.data) {
      return {
        title: defaultSeoData.title,
        description: defaultSeoData.description,
        robots: defaultSeoData.robots,
        alternates: {
          canonical: defaultSeoData.canonical,
        },
      };
    }

    const seoData = result.data;

    const canonical = seoData?.canonicalTag || defaultSeoData.canonical;

    return {
      title: seoData?.siteTitle || defaultSeoData.title,

      description: seoData?.metaDescription || defaultSeoData.description,

      keywords: seoData?.keywords || '',

      robots: seoData?.robotsTag || defaultSeoData.robots,

      alternates: {
        canonical,
      },

      openGraph: {
        siteName: seoData?.ogSiteName || 'سمانه یوگا',

        title: seoData?.ogTitle || seoData?.siteTitle || defaultSeoData.title,

        description:
          seoData?.ogDescription ||
          seoData?.metaDescription ||
          defaultSeoData.description,

        url: toAbsoluteAppUrl(seoData?.ogUrl || '/subscriptions'),

        images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

        type: 'website',
        locale: 'fa_IR',
      },
    };
  } catch (error) {
    console.error('[SUBSCRIPTIONS_METADATA_FETCH_ERROR]', error);

    return {
      title: defaultSeoData.title,
      description: defaultSeoData.description,
      robots: defaultSeoData.robots,
      alternates: {
        canonical: defaultSeoData.canonical,
      },
    };
  }
}

async function fetchSubscriptionPlans() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/subscription/plans`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 3600,
        },
      }
    );

    if (!response.ok) {
      console.error('[SUBSCRIPTION_PLANS_FETCH_ERROR]', response.status);

      return [];
    }

    const result = await response.json();

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('[SUBSCRIPTION_PLANS_FETCH_ERROR]', error);

    return [];
  }
}

async function fetchSubscriptionStatus() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/subscription/status`,
      {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[SUBSCRIPTION_STATUS_FETCH_ERROR]', error);

    return null;
  }
}

export default async function SubscriptionsPage() {
  const [plans, subscriptionStatus] = await Promise.all([
    fetchSubscriptionPlans(),
    fetchSubscriptionStatus(),
  ]);

  const remainingDays = Math.max(
    Number(subscriptionStatus?.remainingDays || 0),
    0
  );

  const hasActiveSubscription = Boolean(
    subscriptionStatus?.hasActiveSubscription && remainingDays > 0
  );

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        {/* Background */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
        >
          <div className='absolute -right-56 top-10 h-[580px] w-[580px] rounded-full bg-secondary/10 blur-[170px]' />

          <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-56 bottom-0 h-[520px] w-[520px] rounded-full blur-[165px]' />

          <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

          <div className='subscriptions-page-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />

          <div className='subscriptions-page-orbit absolute -right-28 top-[420px] h-80 w-80 rounded-full border border-dashed border-secondary/15' />

          <div className='subscriptions-page-orbit-reverse border-yellow/15 absolute -left-28 top-32 h-72 w-72 rounded-full border border-dashed' />
        </div>

        <section className='container mx-auto px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16'>
          {/* Page Hero */}
          <div className='relative overflow-hidden rounded-[32px] border border-black/5 bg-surface-light/70 px-5 py-9 shadow-[0_28px_90px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[42px] sm:px-8 sm:py-12 lg:px-12 lg:py-14 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_32px_100px_rgba(0,0,0,0.28)]'>
            <div
              aria-hidden='true'
              className='absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent'
            />

            <div
              aria-hidden='true'
              className='absolute -right-28 -top-28 h-80 w-80 rounded-full bg-secondary/15 blur-[105px]'
            />

            <div
              aria-hidden='true'
              className='bg-yellow/10 absolute -bottom-36 left-[25%] h-80 w-80 rounded-full blur-[115px]'
            />

            <div className='relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-14'>
              <div className='text-center lg:text-right'>
                <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
                  <HiOutlineSparkles size={18} />

                  <span>دسترسی ساده‌تر به مسیر یادگیری</span>
                </div>

                <h1 className='text-3xl font-black leading-[1.75] text-text-light sm:text-4xl lg:text-5xl lg:leading-[1.65] dark:text-text-dark'>
                  با یک اشتراک، مسیر
                  <span className='relative mx-2 inline-block text-secondary'>
                    تمرین و آگاهی
                    <svg
                      aria-hidden='true'
                      viewBox='0 0 270 24'
                      preserveAspectRatio='none'
                      className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                    >
                      <path
                        d='M6 15C58 4 108 19 159 10C201 3 237 7 264 12'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='5'
                        strokeLinecap='round'
                        opacity='0.82'
                      />

                      <path
                        d='M26 20C80 14 131 20 198 14'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        opacity='0.36'
                      />
                    </svg>
                  </span>
                  را ادامه بده
                </h1>

                <p className='mx-auto mt-6 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 lg:mx-0 dark:text-subtext-dark'>
                  با انتخاب پلن مناسب، تا پایان مدت اشتراک به تمام دوره‌هایی که
                  در آن پلن تعریف شده‌اند، بدون پرداخت جداگانه دسترسی خواهی
                  داشت.
                </p>

                <div className='mt-7 grid gap-3 sm:grid-cols-3'>
                  <div className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-background-light/60 px-3 py-3 text-xs font-bold text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark'>
                    <HiOutlineCheckBadge
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>قیمت‌گذاری شفاف</span>
                  </div>

                  <div className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-background-light/60 px-3 py-3 text-xs font-bold text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark'>
                    <HiOutlineAcademicCap
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>دسترسی به دوره‌ها</span>
                  </div>

                  <div className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-background-light/60 px-3 py-3 text-xs font-bold text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark'>
                    <HiOutlinePlayCircle
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>مشاهده در همه دستگاه‌ها</span>
                  </div>
                </div>
              </div>

              {/* Hero visual */}
              <div className='relative mx-auto flex h-[280px] w-full max-w-[350px] items-center justify-center sm:h-[320px]'>
                <div className='absolute h-[250px] w-[250px] rounded-full bg-secondary/10 blur-[35px] sm:h-[290px] sm:w-[290px]' />

                <div className='subscriptions-visual-orbit absolute h-[250px] w-[250px] rounded-full border border-dashed border-secondary/30 sm:h-[290px] sm:w-[290px]' />

                <div className='subscriptions-visual-orbit-reverse border-yellow/30 absolute h-[195px] w-[195px] rounded-full border border-dashed sm:h-[230px] sm:w-[230px]' />

                <div className='absolute flex h-[145px] w-[145px] items-center justify-center rounded-[48px] border border-white/40 bg-surface-light/75 text-secondary shadow-[0_28px_80px_rgba(38,145,125,0.22)] backdrop-blur-xl sm:h-[170px] sm:w-[170px] sm:rounded-[56px] dark:border-white/10 dark:bg-surface-dark/75'>
                  <HiOutlineAcademicCap className='text-[76px] sm:text-[90px]' />
                </div>

                <span className='subscriptions-float absolute right-2 top-12 rounded-2xl border border-secondary/20 bg-surface-light/80 px-3 py-2 text-xs font-bold text-secondary shadow-lg backdrop-blur-md dark:bg-surface-dark/80'>
                  تمرین پیوسته
                </span>

                <span className='subscriptions-float-delayed border-yellow/20 absolute bottom-12 left-1 rounded-2xl border bg-surface-light/80 px-3 py-2 text-xs font-bold text-text-light shadow-lg backdrop-blur-md dark:bg-surface-dark/80 dark:text-text-dark'>
                  مسیر آگاهانه
                </span>
              </div>
            </div>
          </div>

          {/* Active subscription notice */}
          {hasActiveSubscription && (
            <div className='relative mt-6 overflow-hidden rounded-[26px] border border-secondary/20 bg-secondary/5 px-5 py-5 shadow-[0_18px_55px_rgba(38,145,125,0.08)] sm:px-6 dark:bg-secondary/10'>
              <div
                aria-hidden='true'
                className='absolute -right-16 -top-20 h-48 w-48 rounded-full bg-secondary/15 blur-[65px]'
              />

              <div className='relative flex flex-col gap-4 sm:flex-row sm:items-start'>
                <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-[0_12px_30px_rgba(38,145,125,0.24)]'>
                  <HiOutlineCheckBadge size={26} />
                </span>

                <div>
                  <h2 className='text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
                    اشتراک شما فعال است
                  </h2>

                  <p className='mt-2 text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
                    در حال حاضر
                    <span className='mx-1 font-faNa font-black text-secondary'>
                      {remainingDays.toLocaleString('fa-IR')}
                      روز
                    </span>
                    از اشتراک شما باقی مانده است.
                  </p>

                  <p className='mt-1 text-xs leading-7 text-subtext-light dark:text-subtext-dark'>
                    اشتراک جدیدی که خریداری می‌کنید، پس از پایان اشتراک فعلی
                    به‌صورت خودکار فعال می‌شود و مدت آن به انتهای اشتراک کنونی
                    اضافه خواهد شد.
                  </p>
                </div>
              </div>
            </div>
          )}

          <SubscriptionsPageClient
            plans={plans}
            subscriptionStatus={subscriptionStatus}
          />
        </section>

        <style>{`
          @keyframes subscriptionOrbit {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes subscriptionOrbitReverse {
            from {
              transform: rotate(360deg);
            }

            to {
              transform: rotate(0deg);
            }
          }

          @keyframes subscriptionFloat {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-9px);
            }
          }

          .subscriptions-page-orbit,
          .subscriptions-visual-orbit {
            animation: subscriptionOrbit 34s linear infinite;
          }

          .subscriptions-page-orbit-reverse,
          .subscriptions-visual-orbit-reverse {
            animation: subscriptionOrbitReverse 28s linear infinite;
          }

          .subscriptions-float {
            animation: subscriptionFloat 4s ease-in-out infinite;
          }

          .subscriptions-float-delayed {
            animation: subscriptionFloat 4.5s ease-in-out 1s infinite;
          }

          .subscriptions-page-grid {
            background-image:
              linear-gradient(
                rgba(100, 244, 171, 0.22) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(100, 244, 171, 0.22) 1px,
                transparent 1px
              );

            background-size: 70px 70px;

            mask-image: linear-gradient(
              to bottom,
              transparent,
              black 12%,
              black 88%,
              transparent
            );
          }

          @media (prefers-reduced-motion: reduce) {
            .subscriptions-page-orbit,
            .subscriptions-page-orbit-reverse,
            .subscriptions-visual-orbit,
            .subscriptions-visual-orbit-reverse,
            .subscriptions-float,
            .subscriptions-float-delayed {
              animation: none;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}
