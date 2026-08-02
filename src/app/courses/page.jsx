/* eslint-disable no-undef */
import CourseCard from '@/components/CourseCards/CourseCard';
import CourseHighCard from '@/components/CourseCards/CourseHighCard';
import React from 'react';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Footer from '@/components/Footer/Footer';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

export async function generateMetadata() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/courses`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'دوره‌ ها | سمانه یوگا',
    description:
      'لیستی از بهترین دوره‌های یوگا با امکان شرکت در کلاس‌های آنلاین و حضوری توسط سمانه یوگا ارائه شده است. سطح خود را ارتقا دهید!',
    robots: 'index, follow',
    alternates: {
      canonical: 'https://samaneyoga.ir/courses',
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

      title: seoData?.ogTitle || seoData?.siteTitle || 'دوره‌های آموزشی',

      description: seoData?.ogDescription || seoData?.metaDescription || '',

      url: toAbsoluteAppUrl(seoData?.ogUrl || '/courses'),

      images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

      type: 'website',
      locale: 'fa_IR',
    },
    alternates: {
      canonical: toAbsoluteAppUrl(seoData?.canonicalTag || '/courses'),
    },
  };
}

async function CoursesPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 1, // 2 hours
      },
    }
  );

  const result = await res.json();
  if (!result.success) {
    redirect('/not-found');
  }

  const courses = result.data;
  if (courses === 0) {
    redirect('/not-found');
  }

  return (
    <>
      <HeaderWrapper />
      <div className='container'>
        <PageTitle>دوره‌ها</PageTitle>
        <div className='my-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {courses.map((course) => {
            return course.isHighPriority ? (
              <div
                key={course.id}
                className='col-span-1 sm:col-span-2 lg:col-span-3'
              >
                <CourseHighCard course={course} />
              </div>
            ) : (
              <div key={course.id}>
                <CourseCard
                  course={course}
                  className='h-full bg-surface-light dark:bg-surface-dark'
                />
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CoursesPage;
