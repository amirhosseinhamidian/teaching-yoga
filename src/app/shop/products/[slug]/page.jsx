/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
// app/shop/products/[slug]/page.jsx
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer/Footer';
import ProductDetailsPage from '@/components/templates/shop/product/ProductDetailsPage';
import React from 'react';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export const dynamic = 'force-dynamic';

async function getProduct(slug) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const res = await fetch(
    `${base}/api/shop/products/${encodeURIComponent(slug)}`,
    {
      cache: 'no-store',
    }
  );

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 404) return null;
    // خطاهای دیگر را هم می‌توانی هندل کنی
    return null;
  }
  return data;
}

export default async function ShopProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <>
      <HeaderWrapper />
      <ProductDetailsPage product={product} />
      <Footer />
    </>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  // درخواست برای اطلاعات سئو
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=${slug}`,
    {
      method: 'GET',
    }
  );

  let product;
  if (!res.ok) {
    product = await getProduct(params.slug);
  }

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: product?.title || 'سمانه یوگا',
    description:
      product?.description?.slice?.(0, 150) ||
      `خرید ${product?.title}` ||
      'حرید محصول از سمانه یوگا',
    robots: 'index, follow',
    canonical: `https://samaneyoga.ir/shop/products/${slug}`,
  };

  if (!res.ok) {
    console.error('Failed to fetch SEO data for the product.');
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
      url: seoData.ogUrl || `https://samaneyoga.ir/shop/products/${slug}`,
      images: [
        {
          url: seoData?.ogImage || '',
          alt: seoData?.ogImageAlt || '',
        },
      ],
    },
  };
}
