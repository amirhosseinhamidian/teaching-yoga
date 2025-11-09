'use client';
import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuPencil } from 'react-icons/lu';
import Link from 'next/link';
import HeadAction from './HeadAction';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import { FaCopy } from 'react-icons/fa6';

const PodcastInfo = ({ podcast, loading, className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('https://samaneyoga.ir/rss');
      toast.showSuccessToast('RSS Feed با موفقیت کپی شد');
    } catch (err) {
      toast.showErrorToast('خطا در کپی کردن RSS Feed');
      console.error(err);
    }
  };
  return (
    <div className={`${className}`}>
      <HeadAction podcastId={podcast.id} />
      <div className='mt-4 flex flex-wrap justify-between gap-6'>
        {!loading && (
          <div className='flex items-center gap-4'>
            <Image
              src={
                podcast.logoUrl
                  ? podcast.logoUrl
                  : '/images/default-profile.png'
              }
              alt='samane yoga podcast logo'
              width={300}
              height={300}
              className='h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14 lg:h-16 lg:w-16'
            />
            <h4 className='font-medium'>{podcast.title}</h4>
            <Link href='/a-panel/podcast/edit'>
              <ActionButtonIcon color='blue' icon={LuPencil} />
            </Link>
          </div>
        )}
        <OutlineButton
          onClick={handleCopy}
          className='flex items-center gap-2 text-xs sm:text-sm xl:text-base'
        >
          <FaCopy size={20} />
          RSS Feed
        </OutlineButton>
      </div>
    </div>
  );
};

PodcastInfo.propTypes = {
  podcast: PropTypes.object.isRequired,
  className: PropTypes.string,
  loading: PropTypes.bool.isRequired,
};

export default PodcastInfo;
