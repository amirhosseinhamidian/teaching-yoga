/* eslint-disable no-undef */

'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

import { HiOutlineCheckBadge, HiOutlinePlayCircle } from 'react-icons/hi2';

const CourseWatchCard = ({
  shortAddress,
  viaSubscription = false,
  className = '',
}) => {
  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleGoToCourse = async () => {
    try {
      setLoading(true);

      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

      const response = await fetch(
        `${apiBaseUrl}/api/courses/${encodeURIComponent(
          shortAddress
        )}/first-session`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        toast.showErrorToast(result?.error || 'خطا در ورود به دوره');

        return;
      }

      if (!result?.sessionId) {
        toast.showErrorToast('هنوز جلسه‌ای برای این دوره منتشر نشده است.');

        return;
      }

      router.push(`/courses/${shortAddress}/lesson/${result.sessionId}`);
    } catch (error) {
      console.error('[COURSE_FIRST_SESSION_ERROR]', error);

      toast.showErrorToast('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteCard
      variant='secondary'
      padding='sm'
      radius='md'
      className={className}
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-white'>
          <HiOutlineCheckBadge size={21} />
        </span>

        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-sm font-black text-text-light dark:text-text-dark'>
              دسترسی شما فعال است
            </h2>

            <SiteBadge variant='success' size='sm'>
              {viaSubscription ? 'از طریق اشتراک' : 'خریداری‌شده'}
            </SiteBadge>
          </div>

          <p className='mt-1 text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
            وارد دوره شو و مسیر تمرین را ادامه بده.
          </p>
        </div>

        <SiteButton
          type='button'
          size='md'
          variant='primary'
          startIcon={HiOutlinePlayCircle}
          loading={loading}
          disabled={loading}
          onClick={handleGoToCourse}
          className='w-full sm:w-auto'
        >
          {loading ? 'در حال ورود...' : 'ورود به دوره'}
        </SiteButton>
      </div>
    </SiteCard>
  );
};

CourseWatchCard.propTypes = {
  shortAddress: PropTypes.string.isRequired,

  viaSubscription: PropTypes.bool,

  className: PropTypes.string,
};

export default CourseWatchCard;
