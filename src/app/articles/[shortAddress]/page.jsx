/* eslint-disable react/prop-types */
/* eslint-disable no-undef */

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

import CommentsMainCard from '@/components/Comment/CommentsMainCard';

import SuggestionCourses from '@/components/templates/articles/SuggestionCourses';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { getShamsiDate } from '@/utils/dateTimeHelper';
import { toOpenGraphImages } from '@/server/media/absolute-url';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineHome,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const getSiteBaseUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://samaneyoga.ir').replace(
    /\/+$/,
    ''
  );

const buildSiteUrl = (path = '/') => {
  const normalizedPath =
    typeof path === 'string' && path.startsWith('/') ? path : `/${path || ''}`;

  return new URL(normalizedPath, `${getSiteBaseUrl()}/`).toString();
};

const buildArticlePath = (shortAddress) =>
  `/articles/${encodeURIComponent(String(shortAddress || '').trim())}`;

/*
|--------------------------------------------------------------------------
| Article
|--------------------------------------------------------------------------
*/

const fetchArticleData = async (shortAddress) => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
    }

    const response = await fetch(
      `${apiBaseUrl}/api/articles/${encodeURIComponent(shortAddress)}`,
      {
        method: 'GET',
        cache: 'no-store',
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[ARTICLE_DETAIL_FETCH_ERROR]', error);

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata({ params }) {
  const { shortAddress } = params;

  const articlePath = buildArticlePath(shortAddress);

  const defaultSeo = {
    title: 'مقاله | سمانه یوگا',

    description: 'مقالات آموزشی یوگا و مدیتیشن در سمانه یوگا',

    robots: 'index, follow',

    canonical: `https://samaneyoga.ir/articles/${shortAddress}`,
  };

  try {
    const apiBaseUrl = getApiBaseUrl();

    const article = await fetchArticleData(shortAddress);

    if (!article) {
      return {
        title: 'مقاله پیدا نشد | سمانه یوگا',

        robots: 'noindex, nofollow',
      };
    }

    let seoData = null;

    if (apiBaseUrl) {
      const seoResponse = await fetch(
        `${apiBaseUrl}/api/admin/seo/internal?page=${encodeURIComponent(
          shortAddress
        )}`,
        {
          method: 'GET',

          headers: headers(),

          next: {
            revalidate: 7200,
          },
        }
      );

      if (seoResponse.ok) {
        const seoResult = await seoResponse.json();

        if (seoResult?.success && seoResult?.data) {
          seoData = seoResult.data;
        }
      }
    }

    const title = seoData?.siteTitle || `${article.title} | سمانه یوگا`;

    const description =
      seoData?.metaDescription || article.subtitle || defaultSeo.description;

    const canonical = seoData?.canonicalTag?.startsWith('http')
      ? seoData.canonicalTag
      : buildSiteUrl(seoData?.canonicalTag || articlePath);

    return {
      title,

      description,

      keywords: seoData?.keywords || '',

      robots: seoData?.robotsTag || defaultSeo.robots,

      alternates: {
        canonical,
      },

      openGraph: {
        siteName: seoData?.ogSiteName || 'سمانه یوگا',

        title: seoData?.ogTitle || seoData?.siteTitle || article.title,

        description: seoData?.ogDescription || description,

        url: seoData?.ogUrl?.startsWith('http')
          ? seoData.ogUrl
          : buildSiteUrl(seoData?.ogUrl || articlePath),

        images: toOpenGraphImages(
          seoData?.ogImage || article.cover,

          seoData?.ogImageAlt || article.title
        ),

        type: 'article',

        locale: 'fa_IR',

        publishedTime: article.createAt || undefined,

        modifiedTime: article.updatedAt || undefined,
      },
    };
  } catch (error) {
    console.error('[ARTICLE_METADATA_ERROR]', error);

    return {
      title: defaultSeo.title,

      description: defaultSeo.description,

      robots: defaultSeo.robots,

      alternates: {
        canonical: defaultSeo.canonical,
      },
    };
  }
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

const ArticleDetailPage = async ({ params }) => {
  const { shortAddress } = params;

  const article = await fetchArticleData(shortAddress);

  if (!article) {
    notFound();
  }

  const readTime = Number(article.readTime);

  const hasReadTime = Number.isFinite(readTime) && readTime > 0;

  const articlePath = buildArticlePath(shortAddress);

  const articleUrl = buildSiteUrl(articlePath);

  /*
   * Structured data
   */
  const articleJsonLd = {
    '@context': 'https://schema.org',

    '@type': 'Article',

    headline: article.title,

    description: article.subtitle || undefined,

    image: article.cover ? [article.cover] : undefined,

    datePublished: article.createAt || undefined,

    dateModified: article.updatedAt || article.createAt || undefined,

    mainEntityOfPage: articleUrl,

    publisher: {
      '@type': 'Organization',

      name: 'سمانه یوگا',

      url: buildSiteUrl('/'),
    },
  };

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        {/* JSON-LD */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd),
          }}
        />

        {/* Shared public background */}
        <PageBackground />

        <div className='container relative z-10 mx-auto px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-6 lg:pb-24'>
          {/* Breadcrumb */}
          <nav
            aria-label='مسیر صفحه'
            className='mb-4 flex flex-wrap items-center gap-2 text-[10px] font-medium text-subtext-light sm:mb-5 sm:text-xs dark:text-subtext-dark'
          >
            <Link
              href='/'
              className='flex items-center gap-1.5 transition-colors hover:text-secondary'
            >
              <HiOutlineHome size={14} />

              <span>خانه</span>
            </Link>

            <span aria-hidden='true' className='opacity-40'>
              /
            </span>

            <Link
              href='/articles'
              className='transition-colors hover:text-secondary'
            >
              مقالات
            </Link>

            <span aria-hidden='true' className='opacity-40'>
              /
            </span>

            <span className='max-w-[180px] truncate font-bold text-text-light sm:max-w-xs dark:text-text-dark'>
              {article.title}
            </span>
          </nav>

          {/* =========================
              Article Hero
          ========================== */}
          <SiteCard
            as='header'
            variant='glass'
            padding='none'
            radius='lg'
            topLine
            className='overflow-hidden'
          >
            <div className='grid lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]'>
              {/* Text */}
              <div className='relative flex flex-col justify-center p-5 sm:p-7 lg:p-9 xl:p-10'>
                <div
                  aria-hidden='true'
                  className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
                />

                <div
                  aria-hidden='true'
                  className='bg-yellow/10 absolute -bottom-28 -left-20 h-60 w-60 rounded-full blur-[90px]'
                />

                <div className='relative z-10'>
                  <SiteBadge variant='secondary' size='sm'>
                    <span className='flex items-center gap-1.5'>
                      <HiOutlineSparkles size={14} />
                      مقاله آموزشی
                    </span>
                  </SiteBadge>

                  <h1 className='mt-4 text-2xl font-black leading-[1.75] text-text-light sm:text-3xl sm:leading-[1.7] lg:text-[34px] xl:text-4xl dark:text-text-dark'>
                    {article.title}
                  </h1>

                  {article.subtitle && (
                    <p className='mt-3 max-w-2xl text-xs leading-7 text-subtext-light sm:mt-4 sm:text-sm sm:leading-8 lg:text-[15px] lg:leading-9 dark:text-subtext-dark'>
                      {article.subtitle}
                    </p>
                  )}

                  {/* Meta */}
                  <div className='mt-6 flex flex-wrap gap-2'>
                    {article.updatedAt && (
                      <span className='inline-flex min-h-9 items-center gap-2 rounded-xl border border-black/5 bg-background-light/55 px-3 text-[10px] font-medium text-subtext-light backdrop-blur-md sm:min-h-10 sm:text-xs dark:border-white/10 dark:bg-background-dark/40 dark:text-subtext-dark'>
                        <HiOutlineCalendarDays
                          size={15}
                          className='shrink-0 text-secondary'
                        />

                        <span>آخرین بروزرسانی</span>

                        <strong className='font-faNa text-text-light dark:text-text-dark'>
                          {getShamsiDate(article.updatedAt)}
                        </strong>
                      </span>
                    )}

                    {hasReadTime && (
                      <span className='inline-flex min-h-9 items-center gap-2 rounded-xl border border-secondary/15 bg-secondary/5 px-3 text-[10px] font-bold text-secondary sm:min-h-10 sm:text-xs dark:bg-secondary/10'>
                        <HiOutlineClock size={15} />

                        <span className='font-faNa'>
                          {readTime.toLocaleString('fa-IR')}
                        </span>

                        <span>دقیقه مطالعه</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover */}
              <div className='group relative min-h-[250px] overflow-hidden bg-secondary/5 sm:min-h-[340px] lg:min-h-[430px]'>
                {article.cover ? (
                  <Image
                    src={article.cover}
                    alt={article.title || 'تصویر مقاله'}
                    fill
                    priority
                    sizes='(max-width: 1024px) 100vw, 52vw'
                    className='object-cover transition-transform duration-700 group-hover:scale-[1.025]'
                  />
                ) : (
                  <div className='to-yellow/10 absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/15 via-secondary/5'>
                    <HiOutlineBookOpen
                      size={72}
                      className='text-secondary/35'
                    />
                  </div>
                )}

                <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-l' />

                <span className='absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white backdrop-blur-md'>
                  <HiOutlineBookOpen size={19} />
                </span>
              </div>
            </div>
          </SiteCard>

          {/* =========================
              Content
          ========================== */}
          <div className='mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
            {/* Main */}
            <div className='min-w-0 space-y-6'>
              {/* Article Body */}
              <SiteCard
                as='article'
                variant='glass'
                padding='none'
                radius='lg'
                topLine
                className='relative overflow-hidden px-5 py-6 sm:px-7 sm:py-8 lg:px-9 lg:py-9'
              >
                <div
                  aria-hidden='true'
                  className='absolute -right-28 top-16 h-56 w-56 rounded-full bg-secondary/[0.055] blur-[90px]'
                />

                {/* Heading */}
                <div className='relative z-10 mb-6 flex items-center gap-3 border-b border-black/5 pb-5 dark:border-white/10'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary sm:h-11 sm:w-11'>
                    <HiOutlineBookOpen size={21} />
                  </span>

                  <div className='min-w-0'>
                    <p className='text-[10px] font-bold text-secondary sm:text-xs'>
                      مطالعه مقاله
                    </p>

                    <h2 className='mt-0.5 truncate text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                      {article.title}
                    </h2>
                  </div>
                </div>

                {/* Article HTML */}
                <div
                  className={[
                    'article-content',
                    'relative z-10',
                    'min-w-0 break-words',

                    /*
                     * Base typography
                     */
                    'text-sm leading-8 text-subtext-light',
                    'sm:text-[15px] sm:leading-9',
                    'lg:text-base lg:leading-10',
                    'dark:text-subtext-dark',

                    /*
                     * Paragraph
                     */
                    '[&_p]:my-4',
                    'sm:[&_p]:my-5',

                    /*
                     * Headings
                     */
                    '[&_h1]:mb-4',
                    '[&_h1]:mt-9',
                    '[&_h1]:text-2xl',
                    '[&_h1]:font-black',
                    '[&_h1]:leading-10',
                    '[&_h1]:text-text-light',
                    'dark:[&_h1]:text-text-dark',

                    '[&_h2]:mb-4',
                    '[&_h2]:mt-9',
                    '[&_h2]:text-xl',
                    '[&_h2]:font-black',
                    '[&_h2]:leading-9',
                    '[&_h2]:text-text-light',
                    'sm:[&_h2]:text-2xl',
                    'dark:[&_h2]:text-text-dark',

                    '[&_h3]:mb-3',
                    '[&_h3]:mt-8',
                    '[&_h3]:text-lg',
                    '[&_h3]:font-black',
                    '[&_h3]:leading-8',
                    '[&_h3]:text-text-light',
                    'dark:[&_h3]:text-text-dark',

                    '[&_h4]:mb-3',
                    '[&_h4]:mt-7',
                    '[&_h4]:font-black',
                    '[&_h4]:text-text-light',
                    'dark:[&_h4]:text-text-dark',

                    /*
                     * Strong
                     */
                    '[&_strong]:font-black',
                    '[&_strong]:text-text-light',
                    'dark:[&_strong]:text-text-dark',

                    '[&_b]:font-black',

                    /*
                     * Links
                     */
                    '[&_a]:font-bold',
                    '[&_a]:text-secondary',
                    '[&_a]:underline',
                    '[&_a]:underline-offset-4',

                    /*
                     * Lists
                     */
                    '[&_ul]:my-5',
                    '[&_ul]:list-disc',
                    '[&_ul]:space-y-1.5',
                    '[&_ul]:pr-6',

                    '[&_ol]:my-5',
                    '[&_ol]:list-decimal',
                    '[&_ol]:space-y-1.5',
                    '[&_ol]:pr-6',

                    '[&_li]:leading-8',

                    /*
                     * Quote
                     */
                    '[&_blockquote]:my-7',
                    '[&_blockquote]:rounded-2xl',
                    '[&_blockquote]:border-r-4',
                    '[&_blockquote]:border-secondary',
                    '[&_blockquote]:bg-secondary/5',
                    '[&_blockquote]:px-5',
                    '[&_blockquote]:py-4',
                    '[&_blockquote]:font-medium',
                    '[&_blockquote]:leading-8',
                    'dark:[&_blockquote]:bg-secondary/10',

                    /*
                     * Images
                     */
                    '[&_img]:mx-auto',
                    '[&_img]:my-7',
                    '[&_img]:h-auto',
                    '[&_img]:max-w-full',
                    '[&_img]:rounded-[22px]',

                    /*
                     * Video
                     */
                    '[&_video]:my-7',
                    '[&_video]:h-auto',
                    '[&_video]:max-w-full',
                    '[&_video]:rounded-[22px]',

                    /*
                     * iframe
                     */
                    '[&_iframe]:my-7',
                    '[&_iframe]:max-w-full',

                    /*
                     * HR
                     */
                    '[&_hr]:my-8',
                    '[&_hr]:border-black/10',
                    'dark:[&_hr]:border-white/10',

                    /*
                     * Table
                     */
                    '[&_table]:my-7',
                    '[&_table]:w-full',
                    '[&_table]:border-collapse',
                    '[&_table]:text-xs',
                    'sm:[&_table]:text-sm',

                    '[&_th]:border',
                    '[&_th]:border-black/10',
                    '[&_th]:bg-secondary/5',
                    '[&_th]:p-3',
                    '[&_th]:font-black',
                    '[&_th]:text-text-light',
                    'dark:[&_th]:border-white/10',
                    'dark:[&_th]:bg-secondary/10',
                    'dark:[&_th]:text-text-dark',

                    '[&_td]:border',
                    '[&_td]:border-black/10',
                    '[&_td]:p-3',
                    'dark:[&_td]:border-white/10',

                    /*
                     * Quill helpers
                     */
                    '[&_.ql-align-center]:text-center',
                    '[&_.ql-align-left]:text-left',
                    '[&_.ql-align-right]:text-right',
                    '[&_.ql-align-justify]:text-justify',

                    '[&_.ql-size-small]:text-xs',
                    '[&_.ql-size-large]:text-xl',
                    '[&_.ql-size-huge]:text-2xl',
                  ].join(' ')}
                  dangerouslySetInnerHTML={{
                    __html: article.content || '',
                  }}
                />
              </SiteCard>

              {/* Comments */}
              <CommentsMainCard isCourse={false} referenceId={article.id} />
            </div>

            {/* =========================
                Sidebar
            ========================== */}
            <aside className='min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start'>
              {/* Article Info */}
              <SiteCard
                as='section'
                variant='glass'
                padding='none'
                radius='lg'
                topLine
                className='relative overflow-hidden p-5'
              >
                <div
                  aria-hidden='true'
                  className='absolute -left-20 -top-20 h-44 w-44 rounded-full bg-secondary/10 blur-[75px]'
                />

                <div className='relative z-10'>
                  <div className='flex items-center gap-3'>
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                      <HiOutlineBookOpen size={20} />
                    </span>

                    <div>
                      <p className='text-[10px] font-bold text-secondary'>
                        اطلاعات مقاله
                      </p>

                      <h2 className='mt-0.5 text-sm font-black text-text-light dark:text-text-dark'>
                        درباره این مطلب
                      </h2>
                    </div>
                  </div>

                  <div className='mt-5 divide-y divide-black/5 border-y border-black/5 dark:divide-white/10 dark:border-white/10'>
                    {hasReadTime && (
                      <div className='flex items-center justify-between gap-3 py-3.5'>
                        <span className='flex items-center gap-2 text-xs text-subtext-light dark:text-subtext-dark'>
                          <HiOutlineClock
                            size={16}
                            className='text-secondary'
                          />
                          زمان مطالعه
                        </span>

                        <strong className='font-faNa text-[11px] text-text-light dark:text-text-dark'>
                          {readTime.toLocaleString('fa-IR')} دقیقه
                        </strong>
                      </div>
                    )}

                    {article.createAt && (
                      <div className='flex items-center justify-between gap-3 py-3.5'>
                        <span className='flex items-center gap-2 text-xs text-subtext-light dark:text-subtext-dark'>
                          <HiOutlineCalendarDays
                            size={16}
                            className='text-secondary'
                          />
                          انتشار
                        </span>

                        <strong className='font-faNa text-[10px] text-text-light dark:text-text-dark'>
                          {getShamsiDate(article.createAt)}
                        </strong>
                      </div>
                    )}

                    {article.updatedAt && (
                      <div className='flex items-center justify-between gap-3 py-3.5'>
                        <span className='flex items-center gap-2 text-xs text-subtext-light dark:text-subtext-dark'>
                          <HiOutlineCalendarDays
                            size={16}
                            className='text-secondary'
                          />
                          بروزرسانی
                        </span>

                        <strong className='font-faNa text-[10px] text-text-light dark:text-text-dark'>
                          {getShamsiDate(article.updatedAt)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <Link
                    href='/articles'
                    className='group mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 text-xs font-black text-white shadow-[0_12px_30px_rgba(38,145,125,0.2)] transition-all duration-200 hover:-translate-y-0.5'
                  >
                    همه مقالات
                    <HiOutlineArrowLeft
                      size={16}
                      className='transition-transform duration-200 group-hover:-translate-x-1'
                    />
                  </Link>
                </div>
              </SiteCard>

              {/* Suggested Courses */}
              <SuggestionCourses />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ArticleDetailPage;
