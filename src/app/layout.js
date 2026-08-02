/* eslint-disable react/prop-types */
/* eslint-disable no-undef */

import './globals.css';

import React from 'react';

import { AppProviders } from './providers';

import prismadb from '@/libs/prismadb';

import { getSSRUser } from '@/components/server/HydrateUser';

import ReduxProvider from '@/libs/redux/ReduxProvider';
import UserHydration from '@/components/UserHydration';

import {
  getMetadataBase,
  toAbsoluteAppUrl,
  toAbsoluteMediaUrl,
} from '@/server/media/absolute-url';

const DEFAULT_SITE_TITLE = 'سمانه یوگا';

const DEFAULT_DESCRIPTION = 'آموزش حرفه‌ای یوگا و مدیتیشن برای تمام سطوح.';

const DEFAULT_OG_IMAGE = '/images/hero.png';

const parseKeywords = (value) => {
  if (Array.isArray(value)) {
    return value.map((keyword) => String(keyword || '').trim()).filter(Boolean);
  }

  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return [];
  }

  /*
   * بعضی رکوردها به‌صورت JSON ذخیره شده‌اند:
   * ["یوگا","مدیتیشن"]
   */
  try {
    const parsedValue = JSON.parse(rawValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue
        .map((keyword) => String(keyword || '').trim())
        .filter(Boolean);
    }
  } catch {
    // مقدار JSON نیست؛ به‌صورت متن معمولی پردازش می‌شود.
  }

  /*
   * پشتیبانی از:
   * یوگا، مدیتیشن
   * یوگا, مدیتیشن
   */
  return rawValue
    .split(/[،,]/)
    .map((keyword) => keyword.replace(/^["'\s]+|["'\s]+$/g, '').trim())
    .filter(Boolean);
};

const parseRobots = (value) => {
  const robotsValue =
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  /*
   * رفتار فعلی پروژه حفظ شده:
   * اگر تنظیمی ثبت نشده باشد، صفحه Index نمی‌شود.
   */
  const normalizedValue = robotsValue || 'noindex, nofollow';

  return {
    index: !normalizedValue.includes('noindex'),

    follow: !normalizedValue.includes('nofollow'),

    nocache: normalizedValue.includes('noarchive'),
  };
};

const getGeneralSeoData = async () => {
  try {
    const seoSettings = await prismadb.seoSetting.findMany({
      where: {
        page: 'general',
      },
    });

    return seoSettings.reduce((result, setting) => {
      result[setting.key] = setting.value;

      return result;
    }, {});
  } catch (error) {
    console.error(
      '[generateMetadata] Failed to load general SEO settings:',
      error
    );

    return {};
  }
};

export async function generateMetadata() {
  const seoData = await getGeneralSeoData();

  const title = seoData.siteTitle || DEFAULT_SITE_TITLE;

  const description = seoData.metaDescription || DEFAULT_DESCRIPTION;

  const ogTitle = seoData.ogTitle || title;

  const ogDescription = seoData.ogDescription || description;

  const ogImageValue = seoData.ogImage || DEFAULT_OG_IMAGE;

  let ogImageUrl = null;
  let openGraphUrl = null;
  let canonicalUrl = null;

  try {
    ogImageUrl = toAbsoluteMediaUrl(ogImageValue);
  } catch (error) {
    console.error('[generateMetadata] Invalid OG image:', {
      value: ogImageValue,
      error,
    });
  }

  try {
    openGraphUrl = toAbsoluteAppUrl(seoData.ogUrl || '/');
  } catch (error) {
    console.error('[generateMetadata] Invalid OG URL:', {
      value: seoData.ogUrl,
      error,
    });

    openGraphUrl = toAbsoluteAppUrl('/');
  }

  try {
    canonicalUrl = toAbsoluteAppUrl(seoData.canonicalTag || '/');
  } catch (error) {
    console.error('[generateMetadata] Invalid canonical URL:', {
      value: seoData.canonicalTag,
      error,
    });

    canonicalUrl = toAbsoluteAppUrl('/');
  }

  return {
    /*
     * باعث می‌شود URLهای نسبی Metadata توسط Next
     * براساس دامنه اصلی سایت مطلق شوند.
     */
    metadataBase: getMetadataBase(),

    title,

    description,

    keywords: parseKeywords(seoData.keywords),

    robots: parseRobots(seoData.robotsTag),

    icons: {
      icon: '/favicon.ico',

      shortcut: '/favicon.ico',
    },

    openGraph: {
      siteName: seoData.ogSiteName || DEFAULT_SITE_TITLE,

      title: ogTitle,

      description: ogDescription,

      url: openGraphUrl,

      type: 'website',

      /*
       * نام صحیح این فیلد locale است؛
       * local توسط Next شناخته نمی‌شود.
       */
      locale: 'fa_IR',

      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,

              width: 1200,

              height: 630,

              alt: seoData.ogImageAlt || 'سمانه یوگا',
            },
          ]
        : [],
    },

    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function RootLayout({ children }) {
  const { user } = await getSSRUser();

  return (
    <html lang='fa' dir='rtl'>
      <body className='flex flex-col bg-background-light font-main text-text-light antialiased dark:bg-background-dark dark:text-text-dark'>
        <ReduxProvider>
          <UserHydration user={user} />

          <AppProviders>{children}</AppProviders>
        </ReduxProvider>
      </body>
    </html>
  );
}
