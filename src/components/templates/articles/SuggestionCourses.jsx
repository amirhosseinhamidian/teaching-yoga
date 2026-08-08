/* eslint-disable no-undef */

import React from 'react';
import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
} from 'react-icons/hi2';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const fetchSuggestedCourses = async () => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
    }

    const response = await fetch(`${apiBaseUrl}/api/courses/last-three`, {
      method: 'GET',

      next: {
        revalidate: 7200,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch suggested courses: ${response.status}`);
    }

    const result = await response.json();

    return Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    console.error('[SUGGESTED_COURSES_FETCH_ERROR]', error);

    return [];
  }
};

const SuggestionCourses = async ({ className = '' }) => {
  const courses = await fetchSuggestedCourses();

  if (courses.length === 0) {
    return null;
  }

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`relative overflow-hidden p-5 ${className}`}
    >
      {/* Glow */}
      <div
        aria-hidden='true'
        className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[80px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-5 flex items-center gap-3'>
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineAcademicCap size={22} />
          </span>

          <div className='min-w-0'>
            <SiteBadge variant='secondary' size='sm'>
              ادامه مسیر
            </SiteBadge>

            <h2 className='mt-1.5 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
              دوره‌های پیشنهادی
            </h2>
          </div>
        </div>

        {/* Courses */}
        <div className='space-y-3'>
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.shortAddress}`}
              className='group flex items-center gap-3 rounded-[20px] border border-black/5 bg-background-light/55 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/20 hover:bg-secondary/[0.035] hover:shadow-[0_12px_35px_rgba(38,145,125,0.08)] dark:border-white/10 dark:bg-background-dark/35 dark:hover:bg-secondary/[0.07]'
            >
              {/* Cover */}
              <div className='relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-2xl bg-secondary/10'>
                {course.cover ? (
                  <Image
                    src={course.cover}
                    alt={course.title || 'تصویر دوره'}
                    fill
                    sizes='96px'
                    className='object-cover transition-transform duration-500 group-hover:scale-[1.04]'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-secondary'>
                    <HiOutlineBookOpen size={26} />
                  </div>
                )}

                <div className='absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent' />
              </div>

              {/* Content */}
              <div className='min-w-0 flex-1'>
                <h3 className='line-clamp-2 text-xs font-black leading-6 text-text-light transition-colors duration-200 group-hover:text-secondary sm:text-[13px] dark:text-text-dark'>
                  {course.title}
                </h3>

                <span className='mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-secondary'>
                  مشاهده دوره
                  <HiOutlineArrowLeft
                    size={13}
                    className='transition-transform duration-200 group-hover:-translate-x-1'
                  />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* All Courses */}
        <Link
          href='/courses'
          className='group mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-secondary/20 bg-secondary/5 px-4 text-xs font-black text-secondary transition-all duration-200 hover:border-secondary hover:bg-secondary hover:text-white dark:bg-secondary/10'
        >
          <span>همه دوره‌ها</span>

          <HiOutlineArrowLeft
            size={16}
            className='transition-transform duration-200 group-hover:-translate-x-1'
          />
        </Link>
      </div>
    </SiteCard>
  );
};

SuggestionCourses.propTypes = {
  className: PropTypes.string,
};

export default SuggestionCourses;
