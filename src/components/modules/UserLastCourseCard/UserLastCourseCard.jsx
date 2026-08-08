'use client';

import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';

import { useRouter } from 'next/navigation';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlinePlay,
} from 'react-icons/hi2';

import { PiFlowerLotus, PiPlayCircle, PiSparkle } from 'react-icons/pi';

import { MdSelfImprovement } from 'react-icons/md';

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const UserLastCourseCard = ({
  courseId,
  authLoading = false,
  className = '',
}) => {
  const router = useRouter();

  const [course, setCourse] = useState(null);

  const [loading, setLoading] = useState(Boolean(courseId));

  const [isNextSessionLoading, setIsNextSessionLoading] = useState(false);

  const [coverHasError, setCoverHasError] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Course
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!courseId) {
      setCourse(null);
      setLoading(false);
      setCoverHasError(false);

      return undefined;
    }

    const controller = new AbortController();

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setCoverHasError(false);

        const response = await fetch(`/api/courses/user/${courseId}`, {
          method: 'GET',

          cache: 'no-store',

          signal: controller.signal,
        });

        if (!response.ok) {
          setCourse(null);

          return;
        }

        const data = await response.json();

        setCourse(data?.data || null);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[USER_LAST_COURSE_ERROR]', error);

          setCourse(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCourse();

    return () => {
      controller.abort();
    };
  }, [courseId]);

  /*
  |--------------------------------------------------------------------------
  | Next Session
  |--------------------------------------------------------------------------
  */

  const handleNextSessionClick = async () => {
    if (!course?.shortAddress || isNextSessionLoading) {
      return;
    }

    try {
      setIsNextSessionLoading(true);

      const response = await fetch(
        `/api/courses/${encodeURIComponent(course.shortAddress)}/next-session`,
        {
          method: 'GET',

          cache: 'no-store',
        }
      );

      if (!response.ok) {
        router.push(`/courses/${course.shortAddress}`);

        return;
      }

      const data = await response.json();

      if (data?.sessionId) {
        router.push(`/courses/${course.shortAddress}/lesson/${data.sessionId}`);

        return;
      }

      router.push(`/courses/${course.shortAddress}`);
    } catch (error) {
      console.error('[NEXT_SESSION_ERROR]', error);

      router.push(`/courses/${course.shortAddress}`);
    } finally {
      setIsNextSessionLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (authLoading || loading) {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className={`relative min-h-[190px] overflow-hidden p-5 ${className}`}
      >
        <div
          aria-hidden='true'
          className='absolute -right-20 -top-20 h-48 w-48 rounded-full bg-secondary/10 blur-[75px]'
        />

        <div className='relative z-10 flex min-h-[150px] flex-col items-center justify-center gap-3'>
          <span className='h-7 w-7 animate-spin rounded-full border-[3px] border-secondary/20 border-t-secondary' />

          <span className='text-xs font-bold text-subtext-light dark:text-subtext-dark'>
            در حال دریافت مسیر تمرین...
          </span>
        </div>
      </SiteCard>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Existing Course
  |--------------------------------------------------------------------------
  */

  if (course) {
    const hasCover = Boolean(course?.cover) && !coverHasError;

    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        hover
        className={`group relative overflow-hidden p-4 sm:p-5 ${className}`}
      >
        {/* Glow */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[80px]'
        />

        <div
          aria-hidden='true'
          className='bg-yellow/10 pointer-events-none absolute -bottom-20 right-1/3 h-44 w-44 rounded-full blur-[75px]'
        />

        <div className='relative z-10'>
          {/* Header */}
          <div className='mb-4 flex items-start justify-between gap-4'>
            <div>
              <SiteBadge variant='secondary' size='sm'>
                <span className='flex items-center gap-1.5'>
                  <PiSparkle size={14} />
                  مسیر تمرین شما
                </span>
              </SiteBadge>

              <h2 className='mt-2 font-fancy text-2xl text-secondary sm:text-3xl'>
                ادامه بده!
              </h2>
            </div>

            <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary sm:h-12 sm:w-12'>
              <PiPlayCircle size={27} />
            </span>
          </div>

          {/* Course */}
          <div className='grid gap-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center'>
            {/* Cover */}
            <div className='relative aspect-[16/10] w-full overflow-hidden rounded-[20px] border border-black/5 bg-background-light/70 dark:border-white/10 dark:bg-background-dark/50'>
              {hasCover ? (
                <Image
                  src={course.cover}
                  alt={course.title || 'تصویر دوره'}
                  fill
                  sizes='(max-width: 640px) 100vw, 190px'

                  /*
                   * مهم:
                   *
                   * object-cover قبلی تصویر را Crop می‌کرد.
                   * اینجا کل کاور داخل Frame دیده می‌شود.
                   */
                  className='object-cover transition-transform duration-500 group-hover:scale-[1.025]'
                  onError={() => {
                    console.error(
                      '[USER_LAST_COURSE_COVER_ERROR]',
                      course.cover
                    );

                    setCoverHasError(true);
                  }}
                />
              ) : (
                <div className='to-yellow/10 absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary/10 via-transparent text-secondary'>
                  <HiOutlineBookOpen size={31} />

                  <span className='text-[10px] font-bold text-subtext-light dark:text-subtext-dark'>
                    تصویر دوره
                  </span>
                </div>
              )}

              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent' />
            </div>

            {/* Content */}
            <div className='flex min-w-0 flex-col'>
              <h3 className='line-clamp-2 text-base font-black leading-7 text-text-light sm:text-lg sm:leading-8 dark:text-text-dark'>
                {course.title}
              </h3>

              <p className='mt-1.5 text-xs leading-6 text-subtext-light sm:text-sm sm:leading-7 dark:text-subtext-dark'>
                تمرینت را از همان جایی که متوقف کردی ادامه بده و یک قدم دیگر به
                آرامش و تعادل نزدیک‌تر شو.
              </p>

              <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                <SiteButton
                  type='button'
                  variant='primary'
                  size='md'
                  onClick={handleNextSessionClick}
                  disabled={isNextSessionLoading}
                  className='w-full sm:w-auto'
                >
                  {isNextSessionLoading ? (
                    <span className='flex items-center gap-2'>
                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white' />
                      در حال دریافت...
                    </span>
                  ) : (
                    <span className='flex items-center gap-2'>
                      <HiOutlinePlay size={17} />
                      جلسه بعدی
                      <HiOutlineArrowLeft size={16} />
                    </span>
                  )}
                </SiteButton>

                <SiteButton
                  href={`/courses/${course.shortAddress}`}
                  variant='outline'
                  size='md'
                  className='w-full sm:w-auto'
                >
                  مشاهده دوره
                </SiteButton>
              </div>
            </div>
          </div>
        </div>
      </SiteCard>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Course
  |--------------------------------------------------------------------------
  */

  return (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`group relative overflow-hidden p-4 sm:p-5 ${className}`}
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[80px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/10 pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full blur-[75px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <PiFlowerLotus size={28} />
            </span>

            <div>
              <SiteBadge variant='secondary' size='sm'>
                <span className='flex items-center gap-1.5'>
                  <PiSparkle size={14} />
                  آغاز یک مسیر تازه
                </span>
              </SiteBadge>

              <h2 className='mt-2 font-fancy text-2xl text-secondary sm:text-3xl'>
                از همین امروز شروع کن
              </h2>

              <p className='mt-1.5 max-w-xl text-xs leading-6 text-subtext-light sm:text-sm sm:leading-7 dark:text-subtext-dark'>
                با تمرین‌های اصولی و مرحله‌به‌مرحله، مسیر مناسب خودت را در یوگا
                یا مدیتیشن انتخاب کن.
              </p>
            </div>
          </div>

          <SiteButton
            href='/courses'
            variant='primary'
            size='md'
            endIcon={HiOutlineArrowLeft}
            className='w-full shrink-0 sm:w-auto'
          >
            شروع مسیر
          </SiteButton>
        </div>

        {/* Choices */}
        <div className='mt-5 grid gap-3 sm:grid-cols-2'>
          <button
            type='button'
            onClick={() => router.push('/courses')}
            className='group/item flex min-h-[82px] items-center gap-3 rounded-[20px] border border-black/5 bg-background-light/60 p-3 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/25 hover:bg-secondary/5 dark:border-white/10 dark:bg-background-dark/45 dark:hover:bg-secondary/10'
          >
            <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-transform duration-300 group-hover/item:scale-105'>
              <PiFlowerLotus size={24} />
            </span>

            <span>
              <strong className='block text-sm font-black text-text-light dark:text-text-dark'>
                شروع یوگا
              </strong>

              <span className='mt-1 block text-[11px] leading-5 text-subtext-light dark:text-subtext-dark'>
                افزایش انعطاف، قدرت و تعادل بدن
              </span>
            </span>
          </button>

          <button
            type='button'
            onClick={() => router.push('/courses')}
            className='group/item hover:border-yellow/30 hover:bg-yellow/5 dark:hover:bg-yellow/5 flex min-h-[82px] items-center gap-3 rounded-[20px] border border-black/5 bg-background-light/60 p-3 text-right transition-all duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-background-dark/45'
          >
            <span className='bg-yellow/10 text-yellow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover/item:scale-105'>
              <MdSelfImprovement size={25} />
            </span>

            <span>
              <strong className='block text-sm font-black text-text-light dark:text-text-dark'>
                شروع مدیتیشن
              </strong>

              <span className='mt-1 block text-[11px] leading-5 text-subtext-light dark:text-subtext-dark'>
                آرامش ذهن، تمرکز و حضور در لحظه
              </span>
            </span>
          </button>
        </div>
      </div>
    </SiteCard>
  );
};

UserLastCourseCard.propTypes = {
  courseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

  authLoading: PropTypes.bool,

  className: PropTypes.string,
};

export default UserLastCourseCard;
