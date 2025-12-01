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
import Footer from '@/components/Footer/Footer';
import { redirect } from 'next/navigation';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';

import { getAuthUser } from '@/utils/getAuthUser';
import HeaderWrapper from '@/components/Header/HeaderWrapper';

export async function generateMetadata({ params }) {
  const { shortAddress, id } = params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/seo/internal?page=/courses/${shortAddress}/lesson/${id}`,
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const result = await res.json();

  const defaultSeoData = {
    title: 'سمانه یوگا',
    robots: 'noindex, nofollow',
  };

  if (!result.success || !result.data) return defaultSeoData;

  return {
    title: result.data?.siteTitle || defaultSeoData.title,
    robots: result.data?.robotsTag || defaultSeoData.robots,
  };
}

async function fetchCourseDetails(short) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/course-details?shortAddress=${short}`,
      {
        cache: 'no-store',
        headers: headers(),
      }
    );

    if (!res.ok) throw new Error();

    return await res.json();
  } catch (err) {
    console.error(err);
    redirect('/not-found');
  }
}

async function fetchSessionDetails(sessionId) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/lesson?sessionId=${sessionId}`,
      {
        cache: 'no-store',
        headers: headers(),
      }
    );

    if (!res.ok) throw new Error();

    return await res.json();
  } catch (err) {
    console.error(err);
    redirect('/not-found');
  }
}

async function fetchCourseProgress(shortAddress) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-progress?shortAddress=${shortAddress}`,
      {
        cache: 'no-store',
        headers: headers(), // نیازی به userId نیست
      }
    );

    if (!res.ok) throw new Error();

    return await res.json();
  } catch {
    return { progress: 0 };
  }
}

const LessonPage = async ({ params }) => {
  const user = getAuthUser();
  const userId = user?.id || null;

  if (!userId) {
    redirect('/auth/login');
  }

  const { shortAddress, id: lessonId } = params;

  const course = await fetchCourseDetails(shortAddress);
  const session = await fetchSessionDetails(lessonId);
  const progress = await fetchCourseProgress(shortAddress);

  return (
    <>
      <HeaderWrapper />

      <div className='container'>
        <div className='lg:px-20 xl:px-36'>
          <PageTitle className='font-faNa'>{course.title}</PageTitle>

          {session.video?.videoKey ? (
            <VideoPlayer
              videoUrl={session.mediaLink}
              posterUrl={course.cover}
              sessionId={lessonId}
            />
          ) : session.audio?.audioKey ? (
            <AudioPlayer
              coverUrl={course.cover}
              duration={session.duration}
              sessionId={lessonId}
              src={session.mediaLink}
            />
          ) : (
            <div className='bg-red-50 text-red-500 rounded-xl p-6 text-center text-sm'>
              محتوای این جلسه هنوز بارگذاری نشده است.
            </div>
          )}

          <div className='my-4 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7'>
            {/* Left area */}
            <div className='col-span-1 md:col-span-2 xl:col-span-5'>
              <div className='rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
                <h2 className='text-base font-semibold sm:text-lg lg:text-2xl'>
                  {session.name}
                </h2>
              </div>

              <CourseLessonsCard
                className='mt-4'
                activeSessionId={lessonId}
                shortAddress={shortAddress}
              />

              <QuestionBox
                className='mt-4'
                courseId={course.id}
                sessionId={session.id}
              />
            </div>

            {/* Right area */}
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
