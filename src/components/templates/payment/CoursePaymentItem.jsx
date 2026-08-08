'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import { HiOutlineAcademicCap, HiOutlinePhoto } from 'react-icons/hi2';

const CoursePaymentItem = ({ data }) => {
  const [imageError, setImageError] = useState(false);

  const finalPrice = Number(data?.finalPrice || 0);

  return (
    <article className='group flex items-center justify-between gap-3 py-3.5'>
      <div className='flex min-w-0 items-center gap-3'>
        <div className='relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-background-light/55 dark:border-white/10 dark:bg-background-dark/35'>
          {data?.courseCoverImage && !imageError ? (
            <Image
              src={data.courseCoverImage}
              alt={data?.courseTitle || 'دوره آموزشی'}
              fill
              sizes='80px'
              className='object-cover transition-transform duration-500 group-hover:scale-[1.03]'
              onError={() => setImageError(true)}
            />
          ) : (
            <HiOutlinePhoto size={22} className='text-secondary/40' />
          )}
        </div>

        <div className='min-w-0'>
          <div className='mb-1 flex items-center gap-1.5 text-[9px] font-bold text-secondary'>
            <HiOutlineAcademicCap size={14} />
            دوره آموزشی
          </div>

          <h3 className='line-clamp-2 text-xs font-black leading-6 text-text-light sm:text-sm dark:text-text-dark'>
            {data?.courseTitle}
          </h3>
        </div>
      </div>

      <div className='shrink-0 text-left'>
        {finalPrice === 0 ? (
          <strong className='text-xs font-black sm:text-sm'>رایگان</strong>
        ) : (
          <div className='flex items-baseline gap-1'>
            <strong className='font-faNa text-sm font-black sm:text-base'>
              {finalPrice.toLocaleString('fa-IR')}
            </strong>
            <span className='text-[8px] text-subtext-light dark:text-subtext-dark'>
              تومان
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

CoursePaymentItem.propTypes = {
  data: PropTypes.object.isRequired,
};

export default CoursePaymentItem;
