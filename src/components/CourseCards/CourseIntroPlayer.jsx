'use client';

import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

import LoadingSpinner from '@/components/SiteUi/Loading/LoadingSpinner';

const VideoPlayer = dynamic(
  () => import('@/components/VideoPlayer/VideoPlayer'),
  {
    ssr: false,

    loading: () => (
      <div className='flex aspect-video w-full items-center justify-center bg-black'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <LoadingSpinner size='lg' light />

          <span className='text-[11px] text-white/65'>
            در حال آماده‌سازی ویدیو...
          </span>
        </div>
      </div>
    ),
  }
);

const CourseIntroPlayer = ({ videoUrl, posterUrl, className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-black/10 bg-black shadow-[0_18px_55px_rgba(0,0,0,0.20)] dark:border-white/10 ${className}`}
    >
      <VideoPlayer videoUrl={videoUrl} posterUrl={posterUrl} />
    </div>
  );
};

CourseIntroPlayer.propTypes = {
  videoUrl: PropTypes.string,
  posterUrl: PropTypes.string,
  className: PropTypes.string,
};

export default CourseIntroPlayer;
