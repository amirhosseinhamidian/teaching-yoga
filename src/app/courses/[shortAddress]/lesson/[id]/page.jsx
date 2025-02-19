/* eslint-disable no-undef */
import React from 'react';
import PropTypes from 'prop-types';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import CourseLessonsCard from '@/components/CourseCards/CourseLessonsCard';
import QuestionBox from '@/components/templates/lesson/QuestionBox';
import { headers } from 'next/headers';
import ProgressBox from '@/components/templates/lesson/ProgressBox';
import InstructorCard from '@/components/modules/InstructorCard/InstructorCard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { shortAddress, id } = params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/courses/${shortAddress}/lesson/${id}`,
    {
      method: 'GET',
      headers: headers(),
    },
  );

  const result = await res.json();

  // اطلاعات پیش‌فرض
  const defaultSeoData = {
    title: 'سمانه یوگا',
    robots: 'noindex, nofollow',
  };

  if (!result.success || !result.data) {
    return defaultSeoData;
  }

  const seoData = result.data;

  return {
    title: seoData?.siteTitle || defaultSeoData.title,
    robots: seoData?.robotsTag || defaultSeoData.robots,
  };
}

// Fetch course details and progress
async function fetchCourseDetails(courseShortAddress) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/course-details?shortAddress=${courseShortAddress}`,
      {
        cache: 'no-store', // Ensures SSR by disabling caching
        method: 'GET',
        headers: headers(),
      },
    );

    if (!res.ok) {
      throw new Error('Failed to fetch course data');
    }

    return res.json();
  } catch (error) {
    console.error(error);
    redirect('/not-found');
  }
}

async function fetchSessionDetails(sessionId) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/lesson?sessionId=${sessionId}`,
      {
        cache: 'no-store', // Ensures SSR by disabling caching
        method: 'GET',
        headers: headers(),
      },
    );
    if (!res.ok) {
      throw new Error('Failed to fetch session details');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching session details:', error);
    return null;
  }
}

async function fetchCourseProgress(courseShortAddress, userId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-progress?shortAddress=${courseShortAddress}`,
    {
      cache: 'no-store', // Ensures SSR by disabling caching
      method: 'GET',
      headers: {
        userId: userId,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch course data');
  }

  return res.json();
}

const LessonPage = async ({ params }) => {
  const sessionAuth = await getServerSession(authOptions);
  const userId = sessionAuth?.user?.userId ? sessionAuth.user.userId : '';
  const courseShortAddress = params.shortAddress;
  const lessonId = params.id;

  // Fetch the course details and session data
  const course = await fetchCourseDetails(courseShortAddress);
  const session = await fetchSessionDetails(lessonId);
  const progress = await fetchCourseProgress(courseShortAddress, userId);

  return (
    <>
      <Header isLogin={sessionAuth} />
      <div className='container'>
        <div className='lg:px-20 xl:px-36'>
          <PageTitle className='font-faNa'>{course.title}</PageTitle>
          <VideoPlayer
            videoUrl={session.videoLink}
            posterUrl={course.cover}
            sessionId={lessonId}
            userId={userId}
          />
          <div className='my-4 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7'>
            <div className='col-span-1 md:col-span-2 xl:col-span-5'>
              <div className='rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
                <h2 className='text-base font-semibold sm:text-lg lg:text-2xl'>
                  {session.name}
                </h2>{' '}
                <p className='ms:mt-3 mt-1 font-faNa text-xs font-thin text-subtext-light sm:text-base dark:text-subtext-dark'>
                  {session.term.name}
                </p>
              </div>

              {/* List of course lessons */}
              <CourseLessonsCard
                className='mt-4'
                activeSessionId={lessonId}
                shortAddress={courseShortAddress}
              />
              <QuestionBox
                className='mt-4'
                courseId={course.id}
                sessionId={session.id}
              />
            </div>
            <div className='col-span-1 flex flex-col gap-4 xl:col-span-2'>
              <ProgressBox progress={progress.progress} />
              <InstructorCard instructor={course.instructor} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

LessonPage.propTypes = {
  params: PropTypes.object.isRequired,
};

export default LessonPage;
