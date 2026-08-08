/* eslint-disable no-undef */

import React from 'react';

import { headers } from 'next/headers';

import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';

import ArticleCard from '@/components/templates/articles/ArticleItem';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import EmptyState from '@/components/SiteUi/EmptyState/EmptyState';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
} from 'react-icons/hi2';

export const revalidate = 7200;

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const getArticles = async () => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/api/articles`, {
      method: 'GET',

      next: {
        revalidate: 7200,
      },
    });

    if (!response.ok) {
      throw new Error(`Articles request failed with status ${response.status}`);
    }

    const result = await response.json().catch(() => null);

    /*
     * پشتیبانی از هر دو ساختار:
     *
     * { data: [...] }
     *
     * یا:
     *
     * [...]
     */
    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('[ARTICLES_PAGE_FETCH_ERROR]', error);

    return [];
  }
};

export async function generateMetadata() {
  const defaultMetadata = {
    title: 'مقالات یوگا، مدیتیشن و سبک زندگی | سمانه یوگا',

    description:
      'مقالات آموزشی سمانه یوگا درباره یوگا، مدیتیشن، تمرین آگاهانه و سبک زندگی سالم.',

    robots: {
      index: true,
      follow: true,
    },
  };

  try {
    const apiBaseUrl = getApiBaseUrl();

    const requestHeaders = headers();

    const response = await fetch(
      `${apiBaseUrl}/api/admin/seo/internal?page=/articles`,
      {
        method: 'GET',

        headers: requestHeaders,

        next: {
          revalidate: 86400,
        },
      }
    );

    if (!response.ok) {
      return defaultMetadata;
    }

    const result = await response.json().catch(() => null);

    const seo = result?.data;

    if (!seo) {
      return defaultMetadata;
    }

    return {
      title: seo.siteTitle || defaultMetadata.title,

      description: seo.description || defaultMetadata.description,

      keywords: seo.keywords || undefined,

      robots: seo.robotsTag || defaultMetadata.robots,
    };
  } catch (error) {
    console.error('[ARTICLES_METADATA_ERROR]', error);

    return defaultMetadata;
  }
}

const ArticlesPage = async () => {
  const articles = await getArticles();

  const articleCount = articles.length;

  const totalReadTime = articles.reduce((total, article) => {
    const readTime = Number(article?.readTime);

    if (!Number.isFinite(readTime)) {
      return total;
    }

    return total + readTime;
  }, 0);

  const pageStats = [
    {
      label: 'مقاله آموزشی',
      value: articleCount.toLocaleString('fa-IR'),
    },

    ...(totalReadTime > 0
      ? [
          {
            label: 'دقیقه مطالعه',
            value: totalReadTime.toLocaleString('fa-IR'),
          },
        ]
      : []),
  ];

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        <PageBackground />

        <div className='container relative z-10 mx-auto px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-6 lg:pb-24'>
          {/* Intro */}
          <PageIntro
            variant='compact'
            eyebrow='مجله سمانه یوگا'
            eyebrowIcon={HiOutlineSparkles}
            title='مطالبی برای'
            highlight='آگاهانه‌تر زندگی کردن'
            description='مجموعه‌ای از مقاله‌های کاربردی درباره یوگا، مدیتیشن، تمرین آگاهانه و موضوعاتی که به داشتن ارتباط بهتر با بدن و ذهن کمک می‌کنند.'
            visualIcon={HiOutlineBookOpen}
            floatingLabels={[
              {
                text: 'مطالعه کوتاه و کاربردی',

                variant: 'yellow',
              },

              {
                text: 'یادگیری در مسیر تمرین',

                variant: 'neutral',
              },
            ]}
            stats={pageStats}
          />

          {articles.length > 0 ? (
            <>
              {/* Section Header */}
              <section className='mt-8 sm:mt-10 lg:mt-12'>
                <div className='mb-5 flex flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between'>
                  <div>
                    <div className='flex items-center gap-2 text-secondary'>
                      <HiOutlineSparkles size={15} />

                      <span className='text-[10px] font-bold sm:text-xs'>
                        تازه‌ترین مطالب
                      </span>
                    </div>

                    <h2 className='mt-1 text-xl font-black leading-9 text-text-light sm:text-2xl dark:text-text-dark'>
                      مقالات سمانه یوگا
                    </h2>

                    <p className='mt-1.5 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                      موضوع موردنظرت را انتخاب کن و با یک مطالعه کوتاه، نکته‌ای
                      تازه به تمرین و سبک زندگی‌ات اضافه کن.
                    </p>
                  </div>

                  <SiteBadge
                    variant='secondary'
                    size='md'
                    className='w-fit font-faNa'
                  >
                    {articleCount.toLocaleString('fa-IR')} مقاله
                  </SiteBadge>
                </div>

                {/* Articles Grid */}
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6'>
                  {articles.map((article, index) => (
                    <ArticleCard
                      key={article.id || article.shortAddress}
                      article={article}
                      priority={index < 3}
                    />
                  ))}
                </div>
              </section>

              {/* Bottom CTA */}
              <SiteCard
                as='section'
                variant='secondary'
                padding='none'
                radius='lg'
                className='relative mt-10 overflow-hidden px-5 py-7 sm:mt-12 sm:px-8 sm:py-9 lg:px-10'
              >
                <div
                  aria-hidden='true'
                  className='absolute -left-20 -top-20 h-56 w-56 rounded-full bg-secondary/10 blur-[80px]'
                />

                <div
                  aria-hidden='true'
                  className='bg-yellow/10 absolute -bottom-24 -right-16 h-56 w-56 rounded-full blur-[90px]'
                />

                <div className='relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='max-w-2xl'>
                    <SiteBadge variant='yellow' size='sm'>
                      ادامه مسیر
                    </SiteBadge>

                    <h2 className='mt-3 text-lg font-black leading-8 text-text-light sm:text-xl dark:text-text-dark'>
                      فقط مطالعه نکن؛ تمرین را هم شروع کن
                    </h2>

                    <p className='mt-2 text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                      اگر موضوعی در مقالات برایت کاربردی بود، می‌توانی از
                      دوره‌های آموزشی سمانه یوگا مسیر تمرین منظم‌تری برای خودت
                      بسازی.
                    </p>
                  </div>

                  <div className='flex flex-col gap-2.5 sm:flex-row'>
                    <SiteButton
                      href='/courses'
                      variant='primary'
                      size='md'
                      endIcon={HiOutlineArrowLeft}
                      className='w-full sm:w-auto'
                    >
                      مشاهده دوره‌ها
                    </SiteButton>

                    <SiteButton
                      href='/contact-us'
                      variant='outline'
                      size='md'
                      startIcon={HiOutlineChatBubbleLeftRight}
                      className='w-full sm:w-auto'
                    >
                      ارتباط با ما
                    </SiteButton>
                  </div>
                </div>
              </SiteCard>
            </>
          ) : (
            <div className='mt-8 sm:mt-10'>
              <EmptyState
                icon={HiOutlineBookOpen}
                eyebrow='مجله سمانه یوگا'
                title='هنوز مقاله‌ای منتشر نشده'
                description='به‌محض انتشار مطالب جدید، مقاله‌ها از همین بخش در دسترس خواهند بود.'
                action={
                  <SiteButton href='/courses' variant='primary' size='md'>
                    مشاهده دوره‌ها
                  </SiteButton>
                }
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ArticlesPage;
