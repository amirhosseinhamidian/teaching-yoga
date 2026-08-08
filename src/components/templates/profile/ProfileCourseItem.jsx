/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';

const clampProgress = (value) => {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) return 0;

  return Math.max(0, Math.min(100, Math.round(number)));
};

const ProfileCourseItem = ({ course, className = '' }) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  const handleNextSessionClick = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.shortAddress}/next-session`
      );
      if (response.ok) {
        const { sessionId } = await response.json();
        router.push(`/courses/${course.shortAddress}/lesson/${sessionId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const progress = clampProgress(course.progress);

  return (
    <SiteCard
      as='article'
      variant='glass'
      padding='none'
      radius='lg'
      hover
      className={`group flex h-full flex-col overflow-hidden ${className}`}
    >
      <div className='relative aspect-[16/10] w-full overflow-hidden bg-background-light/60 dark:bg-background-dark/40'>
        <Image
          src={course.courseCover}
          alt={course.courseTitle}
          fill
          sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
          className='object-cover transition-transform duration-500 group-hover:scale-[1.035]'
        />

        <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent' />

        <span className='absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/45 px-2.5 py-1.5 font-faNa text-[9px] font-black text-white backdrop-blur-md'>
          <HiOutlineCheckCircle size={14} />
          {progress.toLocaleString('fa-IR')}٪ پیشرفت
        </span>
      </div>

      <div className='flex flex-1 flex-col p-4'>
        <h3 className='line-clamp-2 min-h-[48px] text-sm font-black leading-6 text-text-light transition-colors group-hover:text-secondary sm:text-[15px] dark:text-text-dark'>
          {course.courseTitle}
        </h3>

        <div className='mt-4'>
          <div className='mb-2 flex items-center justify-between text-[10px] text-subtext-light dark:text-subtext-dark'>
            <span>پیشرفت دوره</span>
            <span className='font-faNa font-black text-secondary'>
              {progress.toLocaleString('fa-IR')}٪
            </span>
          </div>

          <div className='h-2 overflow-hidden rounded-full bg-secondary/10'>
            <div
              className='h-full rounded-full bg-secondary transition-all duration-500'
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className='mt-5'>
          <SiteButton
            type='button'
            variant='primary'
            size='md'
            disabled={isLoading}
            onClick={handleNextSessionClick}
            className='w-full'
          >
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                در حال دریافت...
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                <HiOutlinePlayCircle size={18} />
                جلسه بعدی
                <HiOutlineArrowLeft size={16} />
              </span>
            )}
          </SiteButton>
        </div>
      </div>
    </SiteCard>
  );
};

ProfileCourseItem.propTypes = {
  course: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default ProfileCourseItem;
