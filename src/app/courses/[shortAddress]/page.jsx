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

import {
  BEGINNER,
  INTERMEDIATE,
  ADVANCED,
  BEGINNER_INTERMEDIATE,
  INTERMEDIATE_ADVANCED,
} from '@/constants/courseLevels';
import { COMPLETED, IN_PROGRESS } from '@/constants/courseStatus';
import Price from '@/components/Price/Price';
import Button from '@/components/Ui/Button/Button';
import CourseDescriptionCard from '@/components/CourseCards/CourseDescriptionCard';
import CourseLessonsCard from '@/components/CourseCards/CourseLessonsCard';
import CommentsMainCard from '@/components/Comment/CommentsMainCard';
import CourseFAQ from '@/components/CourseCards/CourseFAQ';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import InstructorCard from '@/components/modules/InstructorCard/InstructorCard';
import { headers } from 'next/headers';

const fetchCourseData = async (shortAddress) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/courses/${shortAddress}`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 21600, // 6 hours
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
  }
};

async function page({ params }) {
  const { shortAddress } = params;

  const userId = '';
  const { course, videoLink } = await fetchCourseData(shortAddress, userId);

  if (!course) {
    //TODO: redirect to 404
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
    <div className='container'>
      <div className='mb-5 flex flex-col-reverse lg:grid lg:grid-cols-2'>
        <div className='flex flex-col items-center justify-between lg:col-span-1'>
          <div>
            <PageTitle>{course.title}</PageTitle>
            <p className='mb-6 font-thin'>{course.shortDescription}</p>
          </div>
          <div className='flex w-full flex-col gap-4 sm:flex-row'>
            <div className='mx-auto w-full basis-full rounded-xl bg-surface-light p-4 shadow sm:basis-1/2 lg:basis-full dark:bg-surface-dark'>
              <h4 className='mr-4 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
                هزینه و ثبت نام
              </h4>
              <div className='mb-2 mt-2 flex w-full flex-col-reverse flex-wrap items-end justify-between gap-6 md:mt-4 lg:flex-row lg:gap-1'>
                <Button shadow className='w-3/4 self-center sm:py-3 lg:w-2/4'>
                  ثبت نام
                </Button>
                <Price
                  className='ml-4'
                  basePrice={Number(course.basePrice)}
                  price={Number(course.price)}
                />
              </div>
            </div>
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
              value={course.duration}
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
  );
}

export default page;
