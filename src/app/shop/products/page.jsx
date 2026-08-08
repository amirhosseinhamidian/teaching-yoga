/* eslint-disable no-undef */

import React from 'react';

import ProductsPage from '@/components/templates/shop/products/ProductsPage';

import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';

import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/shop/products`,
    {
      method: 'GET',
    }
  );

  const defaultSeoData = {
    title: 'محصولات فروشگاه | سمانه یوگا',

    description:
      'خرید محصولات یوگا و مدیتیشن از سمانه یوگا؛ شامل مت یوگا، اکسسوری تمرین، ابزار ریلکسیشن و لوازم مراقبه با کیفیت و ارسال سریع.',

    robots: 'index, follow',

    canonical: 'https://samaneyoga.ir/shop/products',
  };

  if (!res.ok) {
    console.error('Failed to fetch SEO data for the shop products.');

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

    alternates: {
      canonical: seoData?.canonicalTag || defaultSeoData.canonical,
    },

    openGraph: {
      siteName: seoData?.ogSiteName || 'سمانه یوگا',

      title: seoData?.ogTitle || seoData?.siteTitle || 'محصولات',

      description: seoData?.ogDescription || seoData?.metaDescription || '',

      url: toAbsoluteAppUrl(seoData?.ogUrl || '/shop/products'),

      images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

      type: 'website',

      locale: 'fa_IR',
    },
  };
}

export default function ShopProductsPage() {
  return (
    <>
      <HeaderWrapper />

      <ProductsPage />

      <Footer />
    </>
  );
}
