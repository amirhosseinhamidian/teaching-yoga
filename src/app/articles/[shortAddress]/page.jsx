/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import React from 'react';

import Footer from '@/components/Footer/Footer';
import Image from 'next/image';
import CommentsMainCard from '@/components/Comment/CommentsMainCard';
import SuggestionCourses from '@/components/templates/articles/SuggestionCourses';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export async function generateMetadata({ params }) {
  const { shortAddress } = params;
  // درخواست برای اطلاعات سئو
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=${shortAddress}`,
    {
      method: 'GET',
    }
  );

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'سمانه یوگا',
    description: 'مقالات یوگا و مدیتیشن با سمانه',
    robots: 'index, follow',
    canonical: `https://samaneyoga.ir/articles/${shortAddress}`,
  };

  if (!res.ok) {
    console.error('Failed to fetch SEO data for the article.');
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
      url: seoData.ogUrl || `https://samaneyoga.ir/articles/${shortAddress}`,
      images: [
        {
          url: seoData?.ogImage || '',
          alt: seoData?.ogImageAlt || '',
        },
      ],
    },
  };
}

const fetchArticleData = async (shortAddress) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/articles/${shortAddress}`,
      {
        method: 'GET',
        next: {
          revalidate: 7200, // 2 hours
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch article data');
    }

    const article = await response.json();

    return article;
  } catch (error) {
    console.error('Error fetching article data:', error);
    return null;
  }
};

async function ArticleDetailPage({ params }) {
  const { shortAddress } = params;

  const article = await fetchArticleData(shortAddress);
  return (
    <>
      <HeaderWrapper />
      <div className='container relative grid grid-cols-1 md:grid-cols-3 md:gap-6 xl:grid-cols-4'>
        <main className='col-span-1 md:col-span-2 xl:col-span-3'>
          <div className='my-8 flex w-full justify-center'>
            <Image
              src={article.cover}
              alt={article.title}
              width={1920}
              height={1080}
              className='rounded-xl xs:w-64 sm:w-72 md:w-80 lg:w-96 xl:w-[480px]'
            />
          </div>
          <h1 className='font-semibold xs:text-lg md:text-xl xl:text-2xl'>
            {article.title}
          </h1>
          <p className='font-faNa text-xs text-subtext-light md:text-sm dark:text-subtext-dark'>
            زمان حدودی مطالعه {article.readTime} دقیقه
          </p>
          <div
            className='my-4'
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <CommentsMainCard
            className='my-6 sm:my-10'
            isCourse={false}
            referenceId={article.id}
          />
        </main>
        <aside className='sticky top-0 self-start'>
          <SuggestionCourses className='mb-8 md:my-10' />
        </aside>
      </div>
      <Footer />
    </>
  );
}

export default ArticleDetailPage;
