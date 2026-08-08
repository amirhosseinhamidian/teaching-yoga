/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import ProfileCourseItem from './ProfileCourseItem';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

async function fetchUserCourse() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/user`,
      {
        cache: 'no-store',
        method: 'GET',
      }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch course data');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

const SectionCourse = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCourseProgress = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserCourse();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCourseProgress();
  }, []);

  if (isLoading) {
    return (
      <div className='flex min-h-[360px] w-full flex-col items-center justify-center gap-3'>
        <AiOutlineLoading3Quarters
          size={34}
          className='animate-spin text-secondary'
        />
        <p className='text-xs font-medium text-subtext-light dark:text-subtext-dark'>
          در حال دریافت دوره‌های شما...
        </p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        className='relative overflow-hidden px-5 py-12 text-center sm:py-16'
      >
        <div
          aria-hidden='true'
          className='absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[90px]'
        />

        <div className='relative z-10 mx-auto flex max-w-sm flex-col items-center'>
          <span className='flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
            <HiOutlineAcademicCap size={31} />
          </span>

          <h3 className='mt-4 text-base font-black text-text-light dark:text-text-dark'>
            هنوز دوره‌ای در حساب شما نیست
          </h3>

          <p className='mt-2 text-xs leading-7 text-subtext-light dark:text-subtext-dark'>
            با انتخاب یک دوره می‌توانید مسیر تمرین خود را شروع کنید و پیشرفتتان
            را از همین بخش دنبال کنید.
          </p>

          <Link href='/courses' className='mt-5'>
            <SiteButton
              type='button'
              variant='primary'
              size='md'
              endIcon={HiOutlineArrowLeft}
            >
              مشاهده دوره‌ها
            </SiteButton>
          </Link>
        </div>
      </SiteCard>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
      {courses.map((course) => (
        <ProfileCourseItem key={course.courseId} course={course} />
      ))}
    </div>
  );
};

export default SectionCourse;
