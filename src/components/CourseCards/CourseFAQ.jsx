/* eslint-disable no-undef */

import React from 'react';
import PropTypes from 'prop-types';

import CourseFAQList from './CourseFAQList';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import EmptyState from '@/components/SiteUi/EmptyState/EmptyState';

import { HiOutlineBookOpen, HiOutlineSparkles } from 'react-icons/hi2';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const fetchFAQs = async () => {
  try {
    const apiBaseUrl = getApiBaseUrl();

    if (!apiBaseUrl) {
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
    }

    const response = await fetch(`${apiBaseUrl}/api/faqs`, {
      method: 'GET',

      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      throw new Error(`FAQs API returned ${response.status}`);
    }

    const result = await response.json();

    if (Array.isArray(result)) {
      return result;
    }

    if (Array.isArray(result?.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('[COURSE_FAQS_FETCH_ERROR]', error);

    return [];
  }
};

const CourseFAQ = async ({ className = '' }) => {
  const faqs = await fetchFAQs();

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`px-5 py-7 sm:px-7 sm:py-8 lg:px-8 ${className}`}
    >
      {/* Decorative glow */}
      <div
        aria-hidden='true'
        className='absolute -left-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-7 flex items-start gap-4'>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineBookOpen size={25} />
          </span>

          <div className='min-w-0'>
            <div className='flex items-center gap-2 text-secondary'>
              <HiOutlineSparkles size={16} />

              <span className='text-[10px] font-bold sm:text-xs'>
                پاسخ سؤالات رایج
              </span>
            </div>

            <h2 className='mt-1 text-xl font-black leading-9 text-text-light sm:text-2xl dark:text-text-dark'>
              سؤالات متداول
            </h2>

            <p className='mt-2 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
              پاسخ سؤالات رایج درباره دوره، دسترسی و نحوه استفاده از آموزش‌ها را
              اینجا ببین.
            </p>
          </div>
        </div>

        {faqs.length > 0 ? (
          <CourseFAQList faqs={faqs} />
        ) : (
          <EmptyState
            icon={HiOutlineBookOpen}
            eyebrow='سؤالات متداول'
            title='هنوز سؤالی برای نمایش ثبت نشده است'
            description='سؤالات متداول جدید پس از ثبت در همین بخش نمایش داده خواهند شد.'
          />
        )}
      </div>
    </SiteCard>
  );
};

CourseFAQ.propTypes = {
  className: PropTypes.string,
};

export default CourseFAQ;
