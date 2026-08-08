/* eslint-disable no-undef */

import React from 'react';
import { headers } from 'next/headers';

import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';
import AboutUs from '@/components/templates/contact-us/AboutUs';
import FAQs from '@/components/templates/contact-us/FAQs';

import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { MdSelfImprovement } from 'react-icons/md';

const DEFAULT_SEO = {
  title: 'ارتباط با ما | سمانه یوگا',
  description:
    'برای ارتباط با تیم سمانه یوگا، مشاهده راه‌های تماس، شبکه‌های اجتماعی و پاسخ سؤالات متداول با ما همراه باشید.',
  robots: 'index, follow',
  canonical: 'https://samaneyoga.ir/contact-us',
};

const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
    /\/$/,
    ''
  );

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const requestHeaders = headers();

  const host =
    requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');

  const protocol =
    requestHeaders.get('x-forwarded-proto') ||
    (host?.includes('localhost') ? 'http' : 'https');

  return host ? `${protocol}://${host}` : '';
};

export async function generateMetadata() {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      return {
        title: DEFAULT_SEO.title,
        description: DEFAULT_SEO.description,
        robots: DEFAULT_SEO.robots,
        alternates: {
          canonical: DEFAULT_SEO.canonical,
        },
      };
    }

    const response = await fetch(
      `${apiBaseUrl}/api/admin/seo/internal?page=/contact-us`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch contact SEO: ${response.status}`);
    }

    const result = await response.json();

    if (!result?.success || !result?.data) {
      throw new Error('Contact SEO response is invalid');
    }

    const seoData = result.data;

    return {
      title: seoData?.siteTitle || DEFAULT_SEO.title,

      description: seoData?.metaDescription || DEFAULT_SEO.description,

      keywords: seoData?.keywords || '',

      robots: seoData?.robotsTag || DEFAULT_SEO.robots,

      alternates: {
        canonical: seoData?.canonicalTag || DEFAULT_SEO.canonical,
      },

      openGraph: {
        siteName: seoData?.ogSiteName || 'سمانه یوگا',

        title: seoData?.ogTitle || seoData?.siteTitle || DEFAULT_SEO.title,

        description:
          seoData?.ogDescription ||
          seoData?.metaDescription ||
          DEFAULT_SEO.description,

        url: toAbsoluteAppUrl(seoData?.ogUrl || '/contact-us'),

        images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

        type: 'website',
        locale: 'fa_IR',
      },
    };
  } catch (error) {
    console.error('[CONTACT_US_METADATA_FETCH_ERROR]', error);

    return {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
      robots: DEFAULT_SEO.robots,

      alternates: {
        canonical: DEFAULT_SEO.canonical,
      },
    };
  }
}

const fetchFAQs = async () => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      return [];
    }

    const response = await fetch(`${apiBaseUrl}/api/faqs?category=GENERAL`, {
      method: 'GET',
      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contact FAQs: ${response.status}`);
    }

    const result = await response.json();

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('[CONTACT_US_FAQS_FETCH_ERROR]', error);

    return [];
  }
};

const fetchAboutUsData = async () => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      return null;
    }

    const response = await fetch(`${apiBaseUrl}/api/site-info`, {
      method: 'GET',
      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch site info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[CONTACT_US_SITE_INFO_FETCH_ERROR]', error);

    return null;
  }
};

const ContactUsPage = async () => {
  const [faqs, aboutUs] = await Promise.all([fetchFAQs(), fetchAboutUsData()]);

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        {/* Page background */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
        >
          <div className='absolute -right-56 top-10 h-[580px] w-[580px] rounded-full bg-secondary/10 blur-[170px]' />

          <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-56 bottom-0 h-[520px] w-[520px] rounded-full blur-[165px]' />

          <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

          <div className='contact-page-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />

          <div className='contact-page-orbit absolute -right-32 top-[430px] h-80 w-80 rounded-full border border-dashed border-secondary/15' />

          <div className='contact-page-orbit-reverse border-yellow/15 absolute -left-28 top-28 h-72 w-72 rounded-full border border-dashed' />
        </div>

        <div className='container mx-auto px-4 pb-20 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16'>
          {/* Hero */}
          <section className='relative overflow-hidden rounded-[32px] border border-black/5 bg-surface-light/70 px-5 py-9 shadow-[0_28px_90px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[42px] sm:px-8 sm:py-12 lg:px-12 lg:py-14 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_32px_100px_rgba(0,0,0,0.28)]'>
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

            <div className='relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14'>
              <div className='text-center lg:text-right'>
                <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
                  <HiOutlineSparkles size={18} />

                  <span>ارتباط مستقیم با سمانه یوگا</span>
                </div>

                <h1 className='text-3xl font-black leading-[1.8] text-text-light sm:text-4xl lg:text-5xl lg:leading-[1.7] dark:text-text-dark'>
                  از هر جایی که هستی،
                  <span className='relative mx-2 inline-block text-secondary'>
                    با ما در ارتباط باش
                    <svg
                      aria-hidden='true'
                      viewBox='0 0 320 24'
                      preserveAspectRatio='none'
                      className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                    >
                      <path
                        d='M6 15C66 4 126 19 186 10C233 3 276 7 314 12'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='5'
                        strokeLinecap='round'
                        opacity='0.82'
                      />

                      <path
                        d='M28 20C90 14 154 20 232 14'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        opacity='0.36'
                      />
                    </svg>
                  </span>
                </h1>

                <p className='mx-auto mt-6 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 lg:mx-0 dark:text-subtext-dark'>
                  برای دریافت راهنمایی درباره دوره‌ها، نحوه استفاده از آموزش‌ها
                  یا هر سؤال دیگری، از مسیرهای ارتباطی این صفحه با ما در تماس
                  باش.
                </p>

                <div className='mt-7 grid gap-3 sm:grid-cols-3'>
                  <div className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-background-light/60 px-3 py-3 text-xs font-bold text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark'>
                    <HiOutlineCheckBadge
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>پاسخ‌گویی شفاف</span>
                  </div>

                  <div className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-background-light/60 px-3 py-3 text-xs font-bold text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark'>
                    <HiOutlineChatBubbleLeftRight
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>راه‌های ارتباطی متنوع</span>
                  </div>

                  <div className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-background-light/60 px-3 py-3 text-xs font-bold text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark'>
                    <HiOutlineSparkles
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>همراهی در مسیر تمرین</span>
                  </div>
                </div>
              </div>

              {/* Hero visual */}
              <div className='relative mx-auto flex h-[290px] w-full max-w-[360px] items-center justify-center sm:h-[330px]'>
                <div className='absolute h-[260px] w-[260px] rounded-full bg-secondary/10 blur-[38px] sm:h-[300px] sm:w-[300px]' />

                <div className='contact-visual-orbit absolute h-[260px] w-[260px] rounded-full border border-dashed border-secondary/30 sm:h-[300px] sm:w-[300px]' />

                <div className='contact-visual-orbit-reverse border-yellow/30 absolute h-[200px] w-[200px] rounded-full border border-dashed sm:h-[235px] sm:w-[235px]' />

                <div className='to-yellow/15 absolute h-[170px] w-[170px] rounded-full bg-gradient-to-br from-secondary/20 via-secondary/5 shadow-[0_28px_80px_rgba(38,145,125,0.18)] sm:h-[195px] sm:w-[195px]' />

                <div className='relative flex h-[140px] w-[140px] items-center justify-center rounded-[46px] border border-white/40 bg-surface-light/75 text-secondary shadow-[0_28px_80px_rgba(38,145,125,0.22)] backdrop-blur-xl sm:h-[165px] sm:w-[165px] sm:rounded-[54px] dark:border-white/10 dark:bg-surface-dark/75'>
                  <MdSelfImprovement className='text-[82px] sm:text-[96px]' />
                </div>

                <span className='contact-float absolute right-1 top-12 rounded-2xl border border-secondary/20 bg-surface-light/85 px-3 py-2 text-xs font-bold text-secondary shadow-lg backdrop-blur-md dark:bg-surface-dark/85'>
                  با آرامش بپرس
                </span>

                <span className='contact-float-delayed border-yellow/20 absolute bottom-12 left-0 rounded-2xl border bg-surface-light/85 px-3 py-2 text-xs font-bold text-text-light shadow-lg backdrop-blur-md dark:bg-surface-dark/85 dark:text-text-dark'>
                  همراهت هستیم
                </span>
              </div>
            </div>
          </section>

          {/* Contact and FAQ */}
          <section className='mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10'>
            <AboutUs data={aboutUs} className='self-start' />

            <FAQs data={faqs} className='self-start' />
          </section>
        </div>

        <style>{`
          @keyframes contactOrbit {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }

          @keyframes contactOrbitReverse {
            from {
              transform: rotate(360deg);
            }

            to {
              transform: rotate(0deg);
            }
          }

          @keyframes contactFloat {
            0%,
            100% {
              transform: translateY(0);
            }

            50% {
              transform: translateY(-9px);
            }
          }

          .contact-page-orbit,
          .contact-visual-orbit {
            animation: contactOrbit 34s linear infinite;
          }

          .contact-page-orbit-reverse,
          .contact-visual-orbit-reverse {
            animation: contactOrbitReverse 28s linear infinite;
          }

          .contact-float {
            animation: contactFloat 4s ease-in-out infinite;
          }

          .contact-float-delayed {
            animation: contactFloat 4.6s ease-in-out 1s infinite;
          }

          .contact-page-grid {
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
              black 10%,
              black 90%,
              transparent
            );
          }

          @media (prefers-reduced-motion: reduce) {
            .contact-page-orbit,
            .contact-page-orbit-reverse,
            .contact-visual-orbit,
            .contact-visual-orbit-reverse,
            .contact-float,
            .contact-float-delayed {
              animation: none;
            }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
};

export default ContactUsPage;
