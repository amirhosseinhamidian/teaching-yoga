/* eslint-disable no-undef */
import CourseCard from '@/components/CourseCards/CourseCard';
import { headers } from 'next/headers';
import Link from 'next/link';
import React from 'react';

const fetchCourseData = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses?lastThree=true`,
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

    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Error fetching course data:', error);
  }
};

async function CoursesSection() {
  const { data } = await fetchCourseData();
  return (
    <div className='mt-2 -skew-y-6 transform bg-surface-light shadow-accent-custom sm:mt-10 dark:bg-surface-dark'>
      <div className='flex skew-y-6 flex-col items-center justify-center gap-8 py-12 md:gap-12 md:py-16'>
        <h2
          className='text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl'
          data-aos='fade-up'
          data-aos-delay='200'
          data-aos-duration='1000'
        >
          دوره ها
        </h2>
        <div className='container my-5 grid grid-cols-1 gap-4 sm:my-7 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3 lg:gap-12 xl:px-32'>
          {data.map((course, index) => (
            <div
              key={course.id}
              data-aos={
                index === 0
                  ? 'fade-right'
                  : index === 1
                    ? 'fade-up'
                    : 'fade-left'
              }
              data-aos-mirror='true'
              className='transition-transform duration-300'
            >
              <CourseCard
                course={course}
                className='h-full bg-background-light dark:bg-background-dark'
              />
            </div>
          ))}
        </div>
        <Link
          href='/courses'
          className='rounded-full border border-subtext-light bg-transparent px-6 py-3 font-medium text-subtext-light transition-all duration-200 ease-in hover:border-transparent hover:bg-accent hover:text-text-light dark:border-subtext-dark dark:text-subtext-dark'
        >
          دیدن همه دوره ها
        </Link>
      </div>
    </div>
  );
}

export default CoursesSection;
