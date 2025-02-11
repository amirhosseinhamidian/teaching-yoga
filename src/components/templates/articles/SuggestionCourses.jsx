/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';

const SuggestionCourses = ({ className }) => {
  const [data, setData] = useState(null);
  const fetchCourseData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/last-three`,
        {
          method: 'GET',
          next: { revalidate: 7200 },
        },
      );
      if (!response.ok) throw new Error('Failed to fetch course data');

      const courses = await response.json();
      setData(courses.data);
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  };
  useEffect(() => {
    fetchCourseData();
  }, []);
  return (
    <>
      {data && data.length > 0 && (
        <div
          className={`rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
        >
          <h2 className='mb-4 text-base font-semibold lg:text-lg'>
            دوره های پیشنهادی
          </h2>
          {data.map((course) => (
            <Link
              href={`/courses/${course.shortAddress}`}
              key={course.id}
              className='my-3 flex items-center gap-3 transition-all duration-200 ease-in hover:text-secondary md:cursor-pointer'
            >
              <Image
                src={course.cover}
                alt={course.title}
                width={600}
                height={460}
                className='h-10 w-16 rounded-lg lg:h-14 lg:w-20'
              />
              <h4 className='text-xs sm:text-sm md:text-xs lg:text-base'>
                {course.title}
              </h4>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

SuggestionCourses.propTypes = {
  className: PropTypes.string,
};

export default SuggestionCourses;
