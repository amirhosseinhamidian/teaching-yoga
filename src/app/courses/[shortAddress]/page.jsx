/* eslint-disable react/prop-types */
/* eslint-disable no-undef */

import React from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import HeaderWrapper from '@/components/Header/HeaderWrapper';
import Footer from '@/components/Footer/Footer';

import CourseDetailsCard from '@/components/CourseCards/CourseDetailsCard';
import CourseDescriptionCard from '@/components/CourseCards/CourseDescriptionCard';
import CourseLessonsCard from '@/components/CourseCards/CourseLessonsCard';
import CoursePriceCard from '@/components/CourseCards/CoursePriceCard';
import CourseSubscriptionCard from '@/components/CourseCards/CourseSubscriptionCard';
import CourseWatchCard from '@/components/CourseCards/CourseWatchCard';
import CourseIntroPlayer from '@/components/CourseCards/CourseIntroPlayer';

import InstructorCard from '@/components/modules/InstructorCard/InstructorCard';
import CommentsMainCard from '@/components/Comment/CommentsMainCard';

import CourseFAQ from '@/components/CourseCards/CourseFAQ';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SectionHeader from '@/components/SiteUi/SectionHeader/SectionHeader';

import { getAuthUser } from '@/utils/getAuthUser';
import { formatTime } from '@/utils/dateTimeHelper';

import {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  BEGINNER_INTERMEDIATE,
  INTERMEDIATE_ADVANCED,
  BEGINNER_ADVANCED,
} from '@/constants/courseLevels';

import { COMPLETED, IN_PROGRESS } from '@/constants/courseStatus';

import {
  toAbsoluteAppUrl,
  toOpenGraphImages,
} from '@/server/media/absolute-url';

import {
  HiOutlineAcademicCap,
  HiOutlineCheckBadge,
  HiOutlineHome,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { BsCameraVideo, BsInfoCircle } from 'react-icons/bs';

import { WiTime4 } from 'react-icons/wi';

import { BiBarChartAlt2, BiSupport } from 'react-icons/bi';

import { GrGroup } from 'react-icons/gr';
import { FaStar } from 'react-icons/fa6';
import { FiMonitor } from 'react-icons/fi';
import { PiCrownSimple } from 'react-icons/pi';

export const dynamic = 'force-dynamic';

const DEFAULT_DESCRIPTION =
  'دوره‌های آنلاین یوگا و مدیتیشن سمانه یوگا؛ آموزش اصولی و مرحله‌به‌مرحله برای ساختن یک مسیر تمرینی آگاهانه.';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const getCourseLevel = (level) => {
  switch (level) {
    case BEGINNER:
      return 'مبتدی';

    case INTERMEDIATE:
      return 'متوسط';

    case ADVANCED:
      return 'پیشرفته';

    case BEGINNER_INTERMEDIATE:
      return 'مبتدی تا متوسط';

    case INTERMEDIATE_ADVANCED:
      return 'متوسط تا پیشرفته';

    case BEGINNER_ADVANCED:
      return 'مبتدی تا پیشرفته';

    default:
      return 'مبتدی';
  }
};

const getCourseStatus = (status) => {
  switch (status) {
    case COMPLETED:
      return 'تکمیل‌شده';

    case IN_PROGRESS:
      return 'در حال تکمیل';

    default:
      return 'تکمیل‌شده';
  }
};

const getPricingModeLabel = (pricingMode) => {
  switch (pricingMode) {
    case 'SUBSCRIPTION_ONLY':
      return 'دسترسی با اشتراک';

    case 'BOTH':
      return 'خرید یا اشتراک';

    case 'TERM_ONLY':
    default:
      return 'خرید دوره';
  }
};

const fetchCourseData = async (shortAddress) => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl || !shortAddress) {
      return null;
    }

    const response = await fetch(
      `${apiBaseUrl}/api/courses/${encodeURIComponent(shortAddress)}`,
      {
        method: 'GET',
        headers: headers(),
        cache: 'no-store',
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Course API returned ${response.status}`);
    }

    const result = await response.json();

    const course =
      result?.data &&
      typeof result.data === 'object' &&
      !Array.isArray(result.data)
        ? result.data
        : result;

    if (!course?.id) {
      return null;
    }

    return {
      course,

      videoLink: course?.introLink || '',
    };
  } catch (error) {
    console.error('[COURSE_DETAIL_FETCH_ERROR]', error);

    return null;
  }
};

const checkUserCourseAccess = async (shortAddress, userId) => {
  const defaultResult = {
    hasAccess: false,
    viaSubscription: false,
    inSubscription: false,
  };

  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl || !shortAddress) {
      return defaultResult;
    }

    const url = new URL(`${apiBaseUrl}/api/check-purchase`);

    url.searchParams.set('shortAddress', String(shortAddress));

    if (userId) {
      url.searchParams.set('userId', String(userId));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: headers(),
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || '';

    const data = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};

    const inSubscription = Boolean(
      data?.inSubscription ?? data?.isInSubscription
    );

    if (response.status === 200) {
      const purchased =
        typeof data?.purchased === 'boolean' ? data.purchased : true;

      return {
        hasAccess: purchased || Boolean(data?.viaSubscription),

        viaSubscription: Boolean(data?.viaSubscription),

        inSubscription,
      };
    }

    return {
      ...defaultResult,
      inSubscription,
    };
  } catch (error) {
    console.error('[COURSE_ACCESS_CHECK_ERROR]', error);

    return defaultResult;
  }
};

export async function generateMetadata({ params }) {
  const { shortAddress } = params;

  const defaultSeo = {
    title: 'دوره آموزشی | سمانه یوگا',

    description: DEFAULT_DESCRIPTION,

    robots: 'index, follow',

    canonical: `https://samaneyoga.ir/courses/${shortAddress}`,
  };

  try {
    const apiBaseUrl = getApiBaseUrl();

    const response = await fetch(
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

    if (!response.ok) {
      throw new Error(`Course SEO API returned ${response.status}`);
    }

    const result = await response.json();

    const seoData = result?.data;

    if (!result?.success || !seoData) {
      throw new Error('Course SEO response is invalid');
    }

    return {
      title: seoData?.siteTitle || defaultSeo.title,

      description: seoData?.metaDescription || defaultSeo.description,

      keywords: seoData?.keywords || '',

      robots: seoData?.robotsTag || defaultSeo.robots,

      alternates: {
        canonical: toAbsoluteAppUrl(
          seoData?.canonicalTag || `/courses/${shortAddress}`
        ),
      },

      openGraph: {
        siteName: seoData?.ogSiteName || 'سمانه یوگا',

        title: seoData?.ogTitle || seoData?.siteTitle || defaultSeo.title,

        description:
          seoData?.ogDescription ||
          seoData?.metaDescription ||
          defaultSeo.description,

        url: toAbsoluteAppUrl(seoData?.ogUrl || `/courses/${shortAddress}`),

        images: toOpenGraphImages(seoData?.ogImage, seoData?.ogImageAlt || ''),

        type: 'website',
        locale: 'fa_IR',
      },
    };
  } catch (error) {
    console.error('[COURSE_DETAIL_METADATA_ERROR]', error);

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

const CourseDetailPage = async ({ params }) => {
  const { shortAddress } = params;

  const user = await getAuthUser();

  const [courseResult, accessResult] = await Promise.all([
    fetchCourseData(shortAddress),

    checkUserCourseAccess(shortAddress, user?.id || null),
  ]);

  if (!courseResult?.course) {
    notFound();
  }

  const { course, videoLink } = courseResult;

  const { hasAccess, viaSubscription, inSubscription } = accessResult;

  const allowsDirectPurchase = course.pricingMode !== 'SUBSCRIPTION_ONLY';

  const allowsSubscription =
    course.pricingMode === 'SUBSCRIPTION_ONLY' || course.pricingMode === 'BOTH';

  return (
    <>
      <HeaderWrapper />

      <main
        dir='rtl'
        className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
      >
        <PageBackground />

        <div className='container mx-auto px-4 pb-16 pt-3 sm:px-6 sm:pb-20 sm:pt-6 lg:pb-24 lg:pt-8'>
          {/* Breadcrumb */}
          <nav
            aria-label='مسیر صفحه'
            className='mb-3 flex min-w-0 items-center gap-1.5 overflow-hidden text-[10px] text-subtext-light sm:mb-5 sm:gap-2 sm:text-xs dark:text-subtext-dark'
          >
            <Link
              href='/'
              className='flex shrink-0 items-center gap-1 transition-colors hover:text-secondary'
            >
              <HiOutlineHome size={14} />

              <span className='hidden sm:inline'>خانه</span>
            </Link>

            <span className='opacity-35'>/</span>

            <Link
              href='/courses'
              className='shrink-0 transition-colors hover:text-secondary'
            >
              دوره‌ها
            </Link>

            <span className='opacity-35'>/</span>

            <span className='truncate text-text-light dark:text-text-dark'>
              {course.title}
            </span>
          </nav>

          {/* Course top */}
          <SiteCard
            as='section'
            variant='glass'
            padding='none'
            radius='lg'
            topLine
          >
            <div
              aria-hidden='true'
              className='absolute -right-24 -top-24 h-60 w-60 rounded-full bg-secondary/10 blur-[90px]'
            />

            <div className='relative z-10 grid lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-center'>
              {/* Video - mobile first */}
              <div className='order-1 lg:order-2'>
                <CourseIntroPlayer
                  videoUrl={videoLink}
                  posterUrl={course.cover}
                  className='rounded-none border-0 shadow-none lg:m-5 lg:rounded-[24px]'
                />
              </div>

              {/* Info */}
              <div className='order-2 p-4 sm:p-6 lg:order-1 lg:p-8'>
                <div className='flex flex-wrap gap-2'>
                  <SiteBadge icon={HiOutlineSparkles} size='sm'>
                    دوره آموزشی
                  </SiteBadge>

                  <SiteBadge
                    icon={HiOutlineAcademicCap}
                    variant='neutral'
                    size='sm'
                  >
                    {getCourseLevel(course.level)}
                  </SiteBadge>

                  <SiteBadge
                    icon={
                      allowsSubscription ? PiCrownSimple : HiOutlineCheckBadge
                    }
                    variant={allowsSubscription ? 'yellow' : 'secondary'}
                    size='sm'
                  >
                    {getPricingModeLabel(course.pricingMode)}
                  </SiteBadge>

                  {hasAccess && (
                    <SiteBadge
                      icon={HiOutlineCheckBadge}
                      variant='success'
                      size='sm'
                    >
                      دسترسی فعال
                    </SiteBadge>
                  )}

                  {!hasAccess && inSubscription && (
                    <SiteBadge icon={PiCrownSimple} variant='yellow' size='sm'>
                      موجود در اشتراک
                    </SiteBadge>
                  )}
                </div>

                <h1 className='mt-4 text-xl font-black leading-9 text-text-light sm:text-3xl sm:leading-[1.7] lg:text-[34px] dark:text-text-dark'>
                  {course.title}
                </h1>

                {course.shortDescription && (
                  <p className='mt-2 line-clamp-3 text-xs leading-7 text-subtext-light sm:mt-4 sm:line-clamp-none sm:text-sm sm:leading-8 lg:text-base dark:text-subtext-dark'>
                    {course.shortDescription}
                  </p>
                )}

                <div className='mt-4 sm:mt-6'>
                  {hasAccess ? (
                    <CourseWatchCard
                      shortAddress={shortAddress}
                      viaSubscription={viaSubscription}
                    />
                  ) : (
                    <div
                      className={
                        allowsDirectPurchase && allowsSubscription
                          ? 'grid gap-3 md:grid-cols-2'
                          : 'grid grid-cols-1'
                      }
                    >
                      {allowsDirectPurchase && (
                        <CoursePriceCard
                          price={Number(course.price || 0)}
                          discount={Number(course.discount || 0)}
                          finalPrice={Number(course.finalPrice || 0)}
                          courseId={course.id}
                        />
                      )}

                      {allowsSubscription && (
                        <CourseSubscriptionCard courseId={course.id} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SiteCard>

          {/* Course meta */}
          <section className='mt-5 sm:mt-7'>
            <SiteCard variant='glass' padding='md' radius='md' topLine>
              <SectionHeader
                eyebrow='اطلاعات دوره'
                title='مشخصات این آموزش'
                icon={HiOutlineAcademicCap}
                className='mb-4'
              />

              <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6'>
                <CourseDetailsCard
                  icon={BsCameraVideo}
                  title='جلسات'
                  value={course.sessionCount}
                />

                <CourseDetailsCard
                  icon={WiTime4}
                  title='مدت دوره'
                  value={formatTime(course.duration, 'hh:mm:ss')}
                />

                <CourseDetailsCard
                  icon={BiBarChartAlt2}
                  title='سطح'
                  value={getCourseLevel(course.level)}
                />

                <CourseDetailsCard
                  icon={BiSupport}
                  title='پشتیبانی'
                  value='آنلاین'
                />

                <CourseDetailsCard
                  icon={GrGroup}
                  title='هنرجویان'
                  value={course.participants}
                />

                <CourseDetailsCard
                  icon={FiMonitor}
                  title='نوع مشاهده'
                  value='آنلاین'
                />
              </div>
            </SiteCard>
          </section>

          {/* Main */}
          <div className='mt-5 grid items-start gap-5 sm:mt-7 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-7 xl:grid-cols-[minmax(0,1fr)_340px]'>
            <div className='min-w-0 space-y-5'>
              <CourseDescriptionCard description={course.description} />

              <CourseLessonsCard shortAddress={course.shortAddress} />

              <CommentsMainCard isCourse referenceId={course.id} />

              <CourseFAQ />
            </div>

            {/* Sidebar */}
            <aside className='space-y-4 lg:sticky lg:top-24'>
              <InstructorCard instructor={course.instructor} />

              <div className='grid grid-cols-2 gap-3'>
                <CourseDetailsCard
                  icon={FaStar}
                  title='رضایت'
                  value={course.rating}
                />

                <CourseDetailsCard
                  icon={BsInfoCircle}
                  title='وضعیت'
                  value={getCourseStatus(course.status)}
                />
              </div>

              <SiteCard
                variant='secondary'
                padding='sm'
                radius='md'
                className='hidden lg:block'
              >
                <HiOutlineSparkles size={22} className='text-secondary' />

                <h3 className='mt-3 text-sm font-black leading-7 text-text-light dark:text-text-dark'>
                  با ریتم خودت تمرین کن
                </h3>

                <p className='mt-1.5 text-xs leading-7 text-subtext-light dark:text-subtext-dark'>
                  جلسات را مرحله‌به‌مرحله ببین و تمرین‌ها را متناسب با زمان و
                  شرایط خودت ادامه بده.
                </p>
              </SiteCard>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default CourseDetailPage;
