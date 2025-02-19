/* eslint-disable no-undef */
import CourseDetailsCard from '@/components/CourseCards/CourseDetailsCard';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import React from 'react';
import { BsCameraVideo } from 'react-icons/bs';
import { WiTime4 } from 'react-icons/wi';
import { BiBarChartAlt2 } from 'react-icons/bi';
import { BiSupport } from 'react-icons/bi';
import { GrGroup } from 'react-icons/gr';
import { FaStar } from 'react-icons/fa6';
import { BsInfoCircle } from 'react-icons/bs';
import { FiMonitor } from 'react-icons/fi';
import { redirect } from 'next/navigation';

import {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  BEGINNER_INTERMEDIATE,
  INTERMEDIATE_ADVANCED,
} from '@/constants/courseLevels';
import { COMPLETED, IN_PROGRESS } from '@/constants/courseStatus';
import CourseDescriptionCard from '@/components/CourseCards/CourseDescriptionCard';
import CourseLessonsCard from '@/components/CourseCards/CourseLessonsCard';
import CommentsMainCard from '@/components/Comment/CommentsMainCard';
import CourseFAQ from '@/components/CourseCards/CourseFAQ';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import InstructorCard from '@/components/modules/InstructorCard/InstructorCard';
import { headers } from 'next/headers';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CoursePriceCard from '@/components/CourseCards/CoursePriceCard';
import CourseWatchCard from '@/components/CourseCards/CourseWatchCard';
import { formatTime } from '@/utils/dateTimeHelper';

export async function generateMetadata({ params }) {
  const { shortAddress } = params;
  // درخواست برای اطلاعات سئو
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/courses/${shortAddress}`,
    {
      method: 'GET',
      headers: headers(),
    },
  );

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'سمانه یوگا',
    description: 'دوره های یوگا و مدیتیشن با سمانه',
    robots: 'index, follow',
    canonical: `https://samaneyoga.ir/courses/${shortAddress}`,
  };

  if (!res.ok) {
    console.error('Failed to fetch SEO data for the course.');
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
      url: seoData.ogUrl || `https://samaneyoga.ir/courses/${shortAddress}`,
      images: [
        {
          url: seoData?.ogImage || '',
          alt: seoData?.ogImageAlt || '',
        },
      ],
    },
  };
}

const fetchCourseData = async (shortAddress) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 7200, // 2 hours
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch course data');
    }

    const course = await response.json();
    const videoLink = course.introLink;

    return { course, videoLink };
  } catch (error) {
    console.error('Error fetching course data:', error);
    redirect('/not-found');
  }
};

const checkUserBuyCourse = async (shortAddress, userId) => {
  try {
    const purchaseResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/check-purchase?userId=${userId}&shortAddress=${shortAddress}`,
    );
    if (!purchaseResponse.ok) {
      const errorData = await purchaseResponse.json();
      console.error('Error:', errorData);
      return false;
    }

    if (purchaseResponse.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error while checking user course:', error);
    return false;
  }
};

async function page({ params }) {
  const session = await getServerSession(authOptions);
  const { shortAddress } = params;

  const { course, videoLink } = await fetchCourseData(shortAddress);
  const isUserPurchased = await checkUserBuyCourse(
    shortAddress,
    session?.user.userId,
  );

  if (!course) {
    redirect('/not-found');
  }

  const getLevel = (level) => {
    let value = '';
    switch (level) {
      case BEGINNER:
        value = 'مبتدی';
        break;
      case INTERMEDIATE:
        value = 'متوسط';
        break;
      case ADVANCED:
        value = 'پیشرفته';
        break;
      case BEGINNER_INTERMEDIATE:
        value = 'مبتدی/متوسط';
        break;
      case INTERMEDIATE_ADVANCED:
        value = 'متوسط/پیشرفته';
        break;
      default:
        value = 'مبتدی';
        break;
    }
    return value;
  };

  const getCourseStatus = (status) => {
    let value = '';
    switch (status) {
      case COMPLETED:
        value = 'تکمیل شده';
        break;
      case IN_PROGRESS:
        value = 'در حال تکمیل';
        break;
      default:
        value = 'تکمیل شده';
        break;
    }
    return value;
  };

  return (
    <>
      <Header isLogin={session} />
      <div className='container'>
        <div className='mb-5 flex flex-col-reverse lg:grid lg:grid-cols-2'>
          <div className='flex flex-col justify-between lg:col-span-1'>
            <div>
              <PageTitle className='font-faNa'>{course.title}</PageTitle>
              <p className='mb-6 font-thin'>{course.shortDescription}</p>
            </div>
            <div className='flex w-full flex-col gap-4 sm:flex-row'>
              {isUserPurchased ? (
                <CourseWatchCard
                  shortAddress={shortAddress}
                  className='w-full basis-full sm:basis-1/2 lg:basis-full'
                />
              ) : (
                <CoursePriceCard
                  price={course.price}
                  discount={course.discount}
                  finalPrice={course.finalPrice}
                  courseId={course.id}
                  className='w-full basis-full sm:basis-1/2 lg:basis-full'
                />
              )}
              {/* for smaller screen */}
              <div className='self-stretch sm:basis-1/2 lg:hidden'>
                <InstructorCard
                  instructor={course.instructor}
                  className='h-full justify-between'
                />
              </div>
            </div>
          </div>
          <div className='m-auto mt-10 items-center lg:col-span-1 lg:mt-0 lg:py-8 lg:pr-10'>
            <VideoPlayer videoUrl={videoLink} posterUrl={course.cover} />
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2 sm:gap-4'>
          <div className='col-span-3 lg:col-span-2'>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:gap-4'>
              <CourseDetailsCard
                icon={BsCameraVideo}
                title='تعداد جلسات'
                value={course.sessionCount}
                horizontal={true}
              />
              <CourseDetailsCard
                icon={WiTime4}
                title='زمان دوره'
                value={formatTime(course.duration, 'hh:mm:ss')}
                horizontal={true}
              />
              <CourseDetailsCard
                icon={BiBarChartAlt2}
                title='سطح دوره'
                value={getLevel(course.level)}
                horizontal={true}
              />
              <CourseDetailsCard
                icon={BiSupport}
                title='پشتیبانی'
                value='آنلاین'
                horizontal={true}
              />
              <CourseDetailsCard
                icon={GrGroup}
                title='شرکت کنندگان'
                value={course.participants}
                horizontal={true}
              />
              <CourseDetailsCard
                icon={FiMonitor}
                title='نوع مشاهده'
                value='آنلاین'
                horizontal={true}
              />
            </div>
            <CourseDescriptionCard
              description={course.description}
              className='mt-4'
            />
            <CourseLessonsCard
              className='mt-4'
              shortAddress={course.shortAddress}
            />
            <CommentsMainCard
              className='mt-4'
              isCourse={true}
              referenceId={course.id}
            />
            <CourseFAQ className='my-4' />
          </div>
          {/* for larger screen */}
          <div className='hidden lg:col-span-1 lg:block'>
            <InstructorCard instructor={course.instructor} />
            <div className='mt-3 grid grid-cols-2 gap-3'>
              <CourseDetailsCard
                icon={FaStar}
                title='میزان رضایت'
                value={course.rating}
              />

              <CourseDetailsCard
                icon={BsInfoCircle}
                title='وضعیت دوره'
                value={getCourseStatus(course.status)}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default page;
