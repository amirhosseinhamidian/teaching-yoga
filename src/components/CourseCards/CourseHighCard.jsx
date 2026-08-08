/* eslint-disable no-undef */

'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import Price from '../Price/Price';

import CardActions from './CardActions';
import SubscriptionBadge from './SubscriptionBadge';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { fadeUp, viewportOnce } from '@/lib/motion/siteMotion';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const CourseHighCard = ({ course, className = '' }) => {
  const router = useRouter();

  const [isEnterCourseLoading, setIsEnterCourseLoading] = useState(false);

  const isSubscriptionOnly = course?.pricingMode === 'SUBSCRIPTION_ONLY';

  const isBoth = course?.pricingMode === 'BOTH';

  const hasAccess = Boolean(course?.hasAccess);

  const viaSubscription = Boolean(course?.viaSubscription);

  const hasDirectCourseAccess = Boolean(course?.hasDirectCourseAccess);

  const showSubscriptionBadgeOnly = isSubscriptionOnly;

  const showSubscriptionBadgeAlso = isBoth && Boolean(course?.isInSubscription);

  const detailHref = `/courses/${course.shortAddress}`;

  const accessText = useMemo(() => {
    if (!hasAccess) {
      return null;
    }

    if (viaSubscription) {
      return 'دسترسی شما از طریق اشتراک فعال است.';
    }

    if (hasDirectCourseAccess) {
      return 'شما هنرجوی این دوره هستید.';
    }

    return 'دسترسی شما به این دوره فعال است.';
  }, [hasAccess, viaSubscription, hasDirectCourseAccess]);

  const handleEnterCourse = async () => {
    try {
      setIsEnterCourseLoading(true);

      const response = await fetch(
        `/api/courses/${course.shortAddress}/next-session`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        router.push(detailHref);
        return;
      }

      const result = await response.json();

      if (result?.sessionId) {
        router.push(
          `/courses/${course.shortAddress}/lesson/${result.sessionId}`
        );

        return;
      }

      router.push(detailHref);
    } catch (error) {
      console.error('[ENTER_HIGH_PRIORITY_COURSE_ERROR]', error);

      router.push(detailHref);
    } finally {
      setIsEnterCourseLoading(false);
    }
  };

  return (
    <motion.article
      variants={fadeUp}
      initial='hidden'
      whileInView='visible'
      viewport={viewportOnce}
      className={`group ${className}`}
    >
      <SiteCard
        variant='secondary'
        padding='none'
        radius='lg'
        topLine
        hover
        className='shadow-[0_20px_60px_rgba(38,145,125,0.09)]'
      >
        {/* Decorative background */}
        <div
          aria-hidden='true'
          className='absolute -right-24 -top-24 h-60 w-60 rounded-full bg-secondary/15 blur-[90px]'
        />

        <div
          aria-hidden='true'
          className='bg-yellow/10 absolute -bottom-28 left-[20%] h-60 w-60 rounded-full blur-[95px]'
        />

        <div className='relative z-10 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
          {/* Content */}
          <div className='order-2 flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-7 lg:order-1 lg:px-8 lg:py-8'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='min-w-0 flex-1'>
                <SiteBadge
                  icon={HiOutlineSparkles}
                  variant='secondary'
                  size='sm'
                  className='mb-3'
                >
                  دوره منتخب سمانه یوگا
                </SiteBadge>

                <h2 className='text-xl font-black leading-9 text-text-light sm:text-2xl sm:leading-10 dark:text-text-dark'>
                  {course.title}
                </h2>
              </div>

              {(showSubscriptionBadgeOnly || showSubscriptionBadgeAlso) && (
                <div className='shrink-0'>
                  {showSubscriptionBadgeOnly && (
                    <SubscriptionBadge type='ONLY' />
                  )}

                  {showSubscriptionBadgeAlso && (
                    <SubscriptionBadge type='ALSO' />
                  )}
                </div>
              )}
            </div>

            {course?.subtitle && (
              <p className='mt-3 line-clamp-3 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
                {course.subtitle}
              </p>
            )}

            {hasAccess && (
              <SiteBadge
                icon={HiOutlineCheckBadge}
                variant='success'
                size='md'
                className='mt-4 max-w-full justify-start rounded-xl'
              >
                {accessText}
              </SiteBadge>
            )}

            <div className='mt-5 border-t border-black/5 pt-4 dark:border-white/10'>
              {hasAccess ? (
                <div className='flex flex-col gap-2 sm:flex-row'>
                  <SiteButton
                    type='button'
                    variant='primary'
                    size='md'
                    startIcon={HiOutlinePlayCircle}
                    endIcon={HiOutlineArrowLeft}
                    loading={isEnterCourseLoading}
                    disabled={isEnterCourseLoading}
                    onClick={handleEnterCourse}
                    className='w-full sm:w-auto'
                  >
                    {isEnterCourseLoading ? 'در حال ورود...' : 'ادامه دوره'}
                  </SiteButton>

                  <SiteButton
                    href={detailHref}
                    variant='secondary'
                    size='md'
                    startIcon={HiOutlineBookOpen}
                    className='w-full sm:w-auto'
                  >
                    جزئیات دوره
                  </SiteButton>
                </div>
              ) : (
                <div className='flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between'>
                  <CardActions
                    mainBtnClick={() => router.push(detailHref)}
                    courseId={course.id}
                    subscriptionMode={course.pricingMode}
                    className='w-full xl:max-w-sm'
                  />

                  {!isSubscriptionOnly && (
                    <Price
                      finalPrice={course.finalPrice}
                      price={course.price}
                      discount={course.discount}
                      className='xl:items-end'
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cover */}
          <Link
            href={detailHref}
            aria-label={`مشاهده دوره ${course.title}`}
            className='relative order-1 block min-h-[210px] overflow-hidden sm:min-h-[270px] lg:order-2 lg:min-h-[350px]'
          >
            {course?.cover ? (
              <Image
                src={course.cover}
                alt={course.title}
                fill
                sizes='(max-width: 1024px) 100vw, 40vw'
                className='object-cover transition-transform duration-700 group-hover:scale-105'
              />
            ) : (
              <div className='flex h-full min-h-[210px] w-full items-center justify-center bg-secondary/10 text-secondary lg:min-h-[350px]'>
                <HiOutlineBookOpen size={60} />
              </div>
            )}

            <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5 lg:bg-gradient-to-l' />

            <span className='absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-lg backdrop-blur-md transition-all duration-300 group-hover:bg-secondary'>
              <HiOutlineArrowLeft
                size={19}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </span>
          </Link>
        </div>
      </SiteCard>
    </motion.article>
  );
};

CourseHighCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.number.isRequired,

    title: PropTypes.string.isRequired,

    subtitle: PropTypes.string,

    cover: PropTypes.string,

    shortAddress: PropTypes.string.isRequired,

    pricingMode: PropTypes.oneOf(['TERM_ONLY', 'SUBSCRIPTION_ONLY', 'BOTH']),

    isInSubscription: PropTypes.bool,

    hasAccess: PropTypes.bool,

    viaSubscription: PropTypes.bool,

    hasDirectCourseAccess: PropTypes.bool,

    finalPrice: PropTypes.number,

    price: PropTypes.number,

    discount: PropTypes.number,
  }).isRequired,

  className: PropTypes.string,
};

export default CourseHighCard;
