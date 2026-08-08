/* eslint-disable react/no-unknown-property */
'use client';

import React, { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import PropTypes from 'prop-types';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import UserLastCourseCard from '@/components/modules/UserLastCourseCard/UserLastCourseCard';

import { HiOutlineArrowLeft } from 'react-icons/hi2';

import {
  PiFlowerLotus,
  PiPlayCircle,
  PiSparkle,
  PiStarFourFill,
} from 'react-icons/pi';

import { useAuthUser } from '@/hooks/auth/useAuthUser';

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const DEFAULT_HERO_IMAGE = '/images/hero/hero.webp';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getSiteInfoData = (payload) => {
  if (
    payload?.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload;
  }

  return null;
};

const getHeroImageUrl = (siteInfo) => {
  const value = String(
    siteInfo?.heroImageUrl || siteInfo?.heroImage || ''
  ).trim();

  if (!value) {
    return null;
  }

  /*
   * API بهتر است URL نهایی را
   * برگرداند.
   */
  if (
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('/')
  ) {
    return value;
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| Hero
|--------------------------------------------------------------------------
*/

const HeroSection = ({ lastCourseId = null }) => {
  const { user, loading: userLoading } = useAuthUser();

  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO_IMAGE);

  /*
  |--------------------------------------------------------------------------
  | Setting Hero Image
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let disposed = false;

    const loadSiteInfo = async () => {
      try {
        const response = await fetch('/api/site-info', {
          method: 'GET',

          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Site info request failed: ${response.status}`);
        }

        const payload = await response.json();

        const siteInfo = getSiteInfoData(payload);

        const image = getHeroImageUrl(siteInfo);

        if (!disposed && image) {
          setHeroImageUrl(image);
        }
      } catch (error) {
        console.error('[HERO_SITE_INFO_ERROR]', error);
      }
    };

    loadSiteInfo();

    return () => {
      disposed = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Last Course
  |--------------------------------------------------------------------------
  */

  const resolvedLastCourseId = useMemo(() => {
    if (lastCourseId) {
      return Number(lastCourseId);
    }

    const userCourses = Array.isArray(user?.courses) ? user.courses : [];

    const activeCourses = userCourses
      .filter(
        (item) =>
          item?.courseId &&
          item?.status !== 'CANCELLED' &&
          item?.status !== 'EXPIRED'
      )
      .sort(
        (firstItem, secondItem) =>
          new Date(secondItem?.purchasedAt || 0).getTime() -
          new Date(firstItem?.purchasedAt || 0).getTime()
      );

    return activeCourses[0]?.courseId || null;
  }, [lastCourseId, user?.courses]);

  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light pb-14 pt-3 transition-colors duration-300 sm:pb-20 sm:pt-7 lg:pb-24 dark:bg-background-dark'
    >
      {/* Background */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-48 top-0 h-[480px] w-[480px] rounded-full bg-secondary/10 blur-[140px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-48 top-40 h-[450px] w-[450px] rounded-full blur-[150px]' />

        <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent' />

        <div className='hero-particle-one absolute right-[8%] top-[17%] h-2 w-2 rounded-full bg-secondary/50' />

        <div className='hero-particle-two bg-yellow/50 absolute left-[9%] top-[22%] h-2.5 w-2.5 rounded-full' />

        <svg
          className='absolute right-0 top-20 h-64 w-64 text-secondary opacity-[0.045] dark:opacity-[0.07]'
          viewBox='0 0 240 240'
          fill='none'
        >
          <circle
            cx='120'
            cy='120'
            r='72'
            stroke='currentColor'
            strokeWidth='2'
          />

          <circle
            cx='120'
            cy='120'
            r='103'
            stroke='currentColor'
            strokeWidth='1'
            strokeDasharray='5 8'
          />
        </svg>
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='grid items-center gap-7 lg:min-h-[650px] lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 xl:gap-20'>
          {/* =========================
              Content
          ========================== */}
          <div className='relative z-20 order-2 text-center lg:order-1 lg:text-right'>
            <SiteBadge variant='secondary' size='md' className='mb-4'>
              <span className='flex items-center gap-2'>
                <PiSparkle size={17} />
                مسیر آرامش، تعادل و آگاهی
              </span>
            </SiteBadge>

            <h1 className='text-primary-light dark:text-primary-dark mx-auto max-w-3xl font-fancy text-[32px] leading-[1.85] sm:text-[42px] sm:leading-[1.75] lg:mx-0 lg:text-[48px] xl:text-[56px]'>
              درود و نور بر{' '}
              <span className='relative mx-1 inline-block text-secondary'>
                قلبتون
                <svg
                  aria-hidden='true'
                  viewBox='0 0 190 22'
                  preserveAspectRatio='none'
                  className='text-yellow pointer-events-none absolute -bottom-1 right-0 h-3.5 w-full'
                >
                  <path
                    d='M4 14C35 5 72 18 105 10C133 3 158 6 186 11'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    opacity='0.8'
                  />
                </svg>
              </span>
              ؛
              <br />
              سمانه هستم مدرس بین‌المللی یوگا و مدیتیشن
            </h1>

            <p className='mx-auto mt-4 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 lg:mx-0 dark:text-subtext-dark'>
              با آموزش‌های اصولی و تمرین‌های مرحله‌به‌مرحله، مسیر مناسب خودت را
              آغاز کن و آرامش، تمرکز و تعادل را به بخشی از زندگی روزمره‌ات تبدیل
              کن.
            </p>

            {/* Actions */}
            <div className='mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start'>
              <SiteButton
                href='/courses'
                variant='primary'
                size='lg'
                startIcon={PiPlayCircle}
                endIcon={HiOutlineArrowLeft}
                className='w-full sm:w-auto'
              >
                مشاهده دوره‌ها
              </SiteButton>

              <SiteButton
                href='/subscriptions'
                variant='outline'
                size='lg'
                startIcon={PiFlowerLotus}
                className='w-full sm:w-auto'
              >
                عضویت ویژه
              </SiteButton>
            </div>

            {/* User Course */}
            <UserLastCourseCard
              courseId={resolvedLastCourseId}
              authLoading={userLoading}
              className='mt-7 w-full text-right'
            />
          </div>

          {/* =========================
              Visual
          ========================== */}
          {/* =========================
    Visual
========================== */}
          <div className='relative order-1 flex items-center justify-center lg:order-2'>
            <div className='relative mx-auto aspect-square w-full max-w-[350px] xs:max-w-[410px] sm:max-w-[500px] lg:max-w-[550px] xl:max-w-[600px]'>
              {/* Glow */}
              <div
                aria-hidden='true'
                className='hero-breathe absolute inset-[7%] rounded-full bg-secondary/20 blur-[80px] dark:bg-secondary/25'
              />

              {/* Large orbit */}
              <div
                aria-hidden='true'
                className='hero-orbit absolute inset-0 rounded-full'
              >
                <div className='absolute inset-[2%] rounded-full border border-dashed border-secondary/30' />

                <div className='absolute left-[7%] top-[22%] flex h-9 w-9 items-center justify-center rounded-full border border-secondary/20 bg-surface-light shadow-lg dark:bg-surface-dark'>
                  <span className='h-3.5 w-3.5 rounded-full bg-secondary shadow-[0_0_15px_rgba(38,145,125,0.7)]' />
                </div>

                <div className='border-yellow/20 absolute bottom-[8%] right-[24%] flex h-7 w-7 items-center justify-center rounded-full border bg-surface-light shadow-lg dark:bg-surface-dark'>
                  <span className='bg-yellow h-2.5 w-2.5 rounded-full shadow-[0_0_13px_rgba(245,185,66,0.65)]' />
                </div>
              </div>

              {/* Middle orbit */}
              <div
                aria-hidden='true'
                className='hero-orbit-reverse absolute inset-[7%] rounded-full'
              >
                <div className='absolute inset-0 rounded-full border border-secondary/15' />

                <PiStarFourFill className='text-yellow absolute -top-2 left-1/2 text-xl drop-shadow-md' />

                <PiStarFourFill className='absolute bottom-[7%] right-[3%] text-sm text-secondary' />
              </div>

              {/* Lotus */}
              <div className='hero-floating-badge border-yellow/20 bg-yellow/10 text-yellow absolute left-[1%] top-[13%] z-30 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-[0_14px_35px_rgba(15,23,42,0.12)] backdrop-blur-md sm:h-[68px] sm:w-[68px] lg:h-[72px] lg:w-[72px]'>
                <PiFlowerLotus size={34} />
              </div>

              {/* Main image */}
              <div className='absolute inset-[9%] rounded-[46%_54%_44%_56%/42%_44%_56%_58%] border-[7px] border-surface-light bg-surface-light p-1 shadow-[0_35px_95px_rgba(15,23,42,0.22)] transition-colors duration-300 dark:border-surface-dark dark:bg-surface-dark dark:shadow-[0_40px_105px_rgba(0,0,0,0.42)]'>
                <div className='relative h-full w-full overflow-hidden rounded-[44%_56%_46%_54%/45%_42%_58%_55%]'>
                  <Image
                    key={heroImageUrl}
                    src={heroImageUrl}
                    alt='سمانه، مدرس بین‌المللی یوگا و مدیتیشن'
                    fill
                    priority
                    sizes='(max-width: 480px) 320px, (max-width: 768px) 450px, (max-width: 1280px) 500px, 550px'
                    className='object-cover object-center transition-transform duration-700 hover:scale-[1.035]'
                    onError={() => {
                      if (heroImageUrl !== DEFAULT_HERO_IMAGE) {
                        setHeroImageUrl(DEFAULT_HERO_IMAGE);
                      }
                    }}
                  />

                  <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5' />
                </div>
              </div>

              {/* Floating card */}
              <div className='hero-floating-card absolute bottom-[2%] right-0 z-30 rounded-2xl border border-black/5 bg-surface-light/90 p-3 shadow-xl backdrop-blur-xl sm:right-[2%] sm:p-4 dark:border-white/10 dark:bg-surface-dark/90'>
                <div className='flex items-center gap-3'>
                  <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                    <PiSparkle size={23} />
                  </span>

                  <div className='text-right'>
                    <p className='text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                      مسیر تو از همین‌جا آغاز می‌شود
                    </p>

                    <p className='mt-1 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                      آرام، پیوسته و آگاهانه
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroOrbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes heroOrbitReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes heroBreathe {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.55;
          }

          50% {
            transform: scale(1.07);
            opacity: 0.9;
          }
        }

        @keyframes heroFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-9px);
          }
        }

        .hero-orbit {
          animation: heroOrbit 22s linear infinite;
        }

        .hero-orbit-reverse {
          animation: heroOrbitReverse 16s linear infinite;
        }

        .hero-breathe {
          animation: heroBreathe 5.5s ease-in-out infinite;
        }

        .hero-floating-card,
        .hero-floating-badge {
          animation: heroFloat 5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-orbit,
          .hero-orbit-reverse,
          .hero-breathe,
          .hero-floating-card,
          .hero-floating-badge {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

HeroSection.propTypes = {
  lastCourseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default HeroSection;
