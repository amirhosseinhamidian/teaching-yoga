/* eslint-disable no-undef */
import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import ArticleItem from '@/components/templates/articles/ArticleItem';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import { headers } from 'next/headers';
import React from 'react';
import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/articles`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'مقالات | سمانه یوگا',
    description:
      'لیستی از بهترین مقالات یوگا و مدیتیشن برای اطلاعات بیشتر شما ارائه شده است. سطح خود را ارتقا دهید!',
    robots: 'index, follow',
    alternates: {
      canonical: 'https://samaneyoga.ir/articles',
    },
  };

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

      title: seoData?.ogTitle || seoData?.siteTitle || 'مقالات',

      description: seoData?.ogDescription || seoData?.metaDescription || '',

      url: toAbsoluteAppUrl(seoData?.ogUrl || '/articles'),

      images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

      type: 'website',
      locale: 'fa_IR',
    },
    alternates: {
      canonical: toAbsoluteAppUrl(seoData?.canonicalTag || '/articles'),
    },
  };
}

async function ArticlePage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/articles`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 7200, // 2 hours
      },
    }
  );
  const result = await res.json();
  const articles = result.data;

  return (
    <div>
      <HeaderWrapper />
      <div className='container'>
        <PageTitle>مقالات</PageTitle>
        <div className='my-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {articles.map((article) => (
            <ArticleItem
              key={article.id}
              article={article}
              className='h-full self-stretch'
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ArticlePage;
