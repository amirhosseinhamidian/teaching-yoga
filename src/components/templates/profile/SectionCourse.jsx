/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import ProfileCourseItem from './ProfileCourseItem';
import Link from 'next/link';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

async function fetchUserCourse() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/user`,
      {
        cache: 'no-store', // Ensures SSR by disabling caching
        method: 'GET',
      },
    );

    // اگر پاسخ از سرور موفقیت‌آمیز نبود، خطا پرتاب می‌شود
    if (!res.ok) {
      throw new Error('Failed to fetch course data');
    }

    // بازگشت داده‌ها در صورتی که درخواست موفقیت‌آمیز باشد
    return res.json();
  } catch (error) {
    // در صورت بروز هرگونه خطا، پیام خطا در کنسول ثبت می‌شود
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

  return (
    <>
      {isLoading ? (
        <div className='flex h-full w-full items-center justify-center'>
          <AiOutlineLoading3Quarters
            size={46}
            className='animate-spin text-secondary'
          />
        </div>
      ) : (
        <>
          {courses.length !== 0 ? (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {courses.map((course) => (
                <ProfileCourseItem key={course.courseId} course={course} />
              ))}
            </div>
          ) : (
            <div className='flex h-full w-full flex-col items-center justify-center gap-5'>
              <p className='text-xs font-medium text-subtext-light xs:text-base md:text-lg lg:text-xl dark:text-subtext-dark'>
                شما در دوره ای عضو نیستید.
              </p>
              <Link href='/courses'>
                <OutlineButton className='text-xs sm:text-sm md:text-base'>
                  مشاهده دوره ها
                </OutlineButton>
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default SectionCourse;
