/* eslint-disable no-undef */

import React from 'react';
import { headers } from 'next/headers';

import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';

import CourseCard from '@/components/CourseCards/CourseCard';
import CourseHighCard from '@/components/CourseCards/CourseHighCard';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';
import SectionHeader from '@/components/SiteUi/SectionHeader/SectionHeader';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import EmptyState from '@/components/SiteUi/EmptyState/EmptyState';

import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { MdSelfImprovement } from 'react-icons/md';
import { PiCrownSimple } from 'react-icons/pi';

export const dynamic = 'force-dynamic';

const DEFAULT_SEO = {
  title: 'دوره‌ها | سمانه یوگا',

  description:
    'لیست دوره‌های آنلاین یوگا و مدیتیشن سمانه یوگا؛ مناسب شروع اصولی، تمرین مستمر و ساختن یک سبک زندگی آگاهانه.',

  robots: 'index, follow',

  canonical: 'https://samaneyoga.ir/courses',
};

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

export async function generateMetadata() {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
    }

    const response = await fetch(
      `${apiBaseUrl}/api/admin/seo/internal?page=/courses`,
      {
        method: 'GET',

        headers: headers(),

        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch courses SEO: ${response.status}`);
    }

    const result = await response.json();

    if (!result?.success || !result?.data) {
      throw new Error('Courses SEO response is invalid');
    }

    const seoData = result.data;

    return {
      title: seoData?.siteTitle || DEFAULT_SEO.title,

      description: seoData?.metaDescription || DEFAULT_SEO.description,

      keywords: seoData?.keywords || '',

      robots: seoData?.robotsTag || DEFAULT_SEO.robots,

      alternates: {
        canonical: toAbsoluteAppUrl(seoData?.canonicalTag || '/courses'),
      },

      openGraph: {
        siteName: seoData?.ogSiteName || 'سمانه یوگا',

        title: seoData?.ogTitle || seoData?.siteTitle || DEFAULT_SEO.title,

        description:
          seoData?.ogDescription ||
          seoData?.metaDescription ||
          DEFAULT_SEO.description,

        url: toAbsoluteAppUrl(seoData?.ogUrl || '/courses'),

        images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

        type: 'website',
        locale: 'fa_IR',
      },
    };
  } catch (error) {
    console.error('[COURSES_METADATA_ERROR]', error);

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

const fetchCourses = async () => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
    }

    /*
     * اطلاعات دسترسی کاربر داخل پاسخ این API وجود دارد.
     * بنابراین پاسخ به‌صورت عمومی cache نمی‌شود.
     */
    const response = await fetch(`${apiBaseUrl}/api/courses`, {
      method: 'GET',

      headers: headers(),

      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.status}`);
    }

    const result = await response.json();

    if (!result?.success) {
      throw new Error(result?.error || 'Courses response is invalid');
    }

    return Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    console.error('[COURSES_FETCH_ERROR]', error);

    return [];
  }
};

const CoursesPage = async () => {
  const courses = await fetchCourses();

  const highlightedCourses = courses.filter((course) =>
    Boolean(course?.isHighPriority)
  );

  const regularCourses = courses.filter((course) => !course?.isHighPriority);

  const accessibleCoursesCount = courses.filter((course) =>
    Boolean(course?.hasAccess)
  ).length;

  const subscriptionCoursesCount = courses.filter(
    (course) =>
      course?.pricingMode === 'SUBSCRIPTION_ONLY' ||
      course?.pricingMode === 'BOTH' ||
      course?.isInSubscription
  ).length;

  const pageStats = [
    {
      icon: HiOutlineBookOpen,

      value: courses.length.toLocaleString('fa-IR'),

      label: 'دوره آموزشی',
    },

    {
      icon: HiOutlineCheckBadge,

      value:
        accessibleCoursesCount > 0
          ? accessibleCoursesCount.toLocaleString('fa-IR')
          : null,

      label:
        accessibleCoursesCount > 0 ? 'دوره در دسترس شما' : 'مناسب سطوح مختلف',
    },

    {
      icon: HiOutlinePlayCircle,

      label: 'مشاهده آنلاین در همه دستگاه‌ها',
    },
  ];

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        <PageBackground />

        <div className='container mx-auto px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-8 lg:pb-24 lg:pt-10'>
          {/* Compact page intro */}
          <PageIntro
            variant='compact'
            eyebrow='دوره‌های آموزشی سمانه یوگا'
            eyebrowIcon={HiOutlineSparkles}
            title='دوره مناسب خودت را پیدا کن و'
            highlight='آگاهانه تمرین کن'
            description='از شروع اصول اولیه تا تمرین‌های عمیق‌تر، دوره‌ای را انتخاب کن که با سطح، هدف و سبک زندگی تو هماهنگ باشد.'
            visualIcon={MdSelfImprovement}
            floatingLabels={[
              {
                text: 'شروع از سطح مناسب',
                variant: 'yellow',
              },
              {
                text: 'تمرین مرحله‌به‌مرحله',
                variant: 'neutral',
              },
            ]}
            stats={pageStats}
          />

          {courses.length > 0 ? (
            <>
              {/* Featured courses */}
              {highlightedCourses.length > 0 && (
                <section className='mt-6 sm:mt-10 lg:mt-12'>
                  <SectionHeader
                    eyebrow='پیشنهاد ویژه برای شروع'
                    title='دوره‌های منتخب'
                    icon={HiOutlineSparkles}
                    action={
                      <SiteBadge
                        icon={HiOutlineAcademicCap}
                        variant='secondary'
                        size='md'
                      >
                        {highlightedCourses.length.toLocaleString('fa-IR')} دوره
                        منتخب
                      </SiteBadge>
                    }
                  />

                  <div className='mt-5 space-y-5 sm:mt-6 sm:space-y-6'>
                    {highlightedCourses.map((course) => (
                      <CourseHighCard key={course.id} course={course} />
                    ))}
                  </div>
                </section>
              )}

              {/* All courses */}
              {regularCourses.length > 0 && (
                <section className='mt-10 sm:mt-14 lg:mt-16'>
                  <SectionHeader
                    eyebrow='متناسب با مسیر و هدف شما'
                    title='همه دوره‌ها'
                    description='جزئیات هر دوره را بررسی کن و بر اساس سطح و هدفت مسیر مناسب را انتخاب کن.'
                    icon={HiOutlineBookOpen}
                    action={
                      <SiteBadge variant='neutral' size='md'>
                        {regularCourses.length.toLocaleString('fa-IR')} دوره
                      </SiteBadge>
                    }
                  />

                  <div className='mt-5 grid grid-cols-1 items-stretch gap-5 sm:mt-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
                    {regularCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                </section>
              )}

              {/* Subscription */}
              {subscriptionCoursesCount > 0 && (
                <section className='mt-10 sm:mt-14 lg:mt-16'>
                  <SiteCard
                    as='section'
                    variant='secondary'
                    padding='lg'
                    radius='lg'
                    topLine
                  >
                    <div
                      aria-hidden='true'
                      className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/15 blur-[90px]'
                    />

                    <div
                      aria-hidden='true'
                      className='bg-yellow/10 absolute -bottom-28 left-[20%] hidden h-64 w-64 rounded-full blur-[95px] sm:block'
                    />

                    <div className='relative z-10 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-right lg:justify-between'>
                      <div className='flex flex-col items-center gap-4 sm:flex-row'>
                        <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-[0_13px_30px_rgba(38,145,125,0.24)] sm:h-14 sm:w-14'>
                          <PiCrownSimple size={27} />
                        </span>

                        <div>
                          <SiteBadge
                            icon={HiOutlineSparkles}
                            variant='yellow'
                            size='sm'
                            className='mb-2'
                          >
                            دسترسی با اشتراک
                          </SiteBadge>

                          <h2 className='text-lg font-black leading-8 text-text-light sm:text-xl dark:text-text-dark'>
                            با یک اشتراک به چند دوره دسترسی داشته باش
                          </h2>

                          <p className='mt-1.5 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
                            بعضی از دوره‌ها از طریق پلن‌های اشتراک نیز در دسترس
                            هستند. پلن‌ها را مقایسه کن و گزینه مناسب خودت را
                            انتخاب کن.
                          </p>
                        </div>
                      </div>

                      <SiteButton
                        href='/subscriptions'
                        size='md'
                        variant='primary'
                        startIcon={PiCrownSimple}
                        endIcon={HiOutlineArrowLeft}
                        className='w-full shrink-0 sm:w-auto'
                      >
                        مشاهده پلن‌های اشتراک
                      </SiteButton>
                    </div>
                  </SiteCard>
                </section>
              )}
            </>
          ) : (
            <section className='mt-6 sm:mt-10'>
              <EmptyState
                icon={HiOutlineAcademicCap}
                eyebrow='دوره‌های آموزشی'
                title='در حال حاضر دوره‌ای برای نمایش وجود ندارد'
                description='دوره‌های آموزشی جدید پس از انتشار در همین صفحه نمایش داده خواهند شد.'
              />
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CoursesPage;
