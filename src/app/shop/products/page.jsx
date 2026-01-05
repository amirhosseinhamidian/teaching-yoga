/* eslint-disable no-undef */
import React from 'react';
import ProductsPage from '@/components/templates/shop/products/ProductsPage';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';

export async function generateMetadata() {
  // درخواست برای اطلاعات سئو
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/shop/products`,
    {
      method: 'GET',
    }
  );

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'محصولات فروشگاه |‌ سمانه یوگا',
    description:
      'خرید محصولات یوگا و مدیتیشن از سمانه یوگا؛ شامل مت یوگا، اکسسوری تمرین، ابزار ریلکسیشن و لوازم مراقبه با کیفیت و ارسال سریع.',
    robots: 'index, follow',
    canonical: `https://samaneyoga.ir/shop/products`,
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
    canonical: seoData?.canonicalTag || defaultSeoData.canonical,
    openGraph: {
      title: seoData?.ogTitle || '',
      description: seoData?.ogDescription || '',
      url: seoData.ogUrl || `https://samaneyoga.ir/shop/products`,
      images: [
        {
          url: seoData?.ogImage || '',
          alt: seoData?.ogImageAlt || '',
        },
      ],
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
