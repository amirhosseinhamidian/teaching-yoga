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
import SiteIconButton from '@/components/SiteUi/Button/SiteIconButton';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { fadeUp, viewportOnce } from '@/lib/motion/siteMotion';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';

const CourseCard = ({ course, className = '' }) => {
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
      return 'دسترسی فعال از طریق اشتراک';
    }

    if (hasDirectCourseAccess) {
      return 'شما هنرجوی این دوره هستید';
    }

    return 'دسترسی شما به دوره فعال است';
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
      console.error('[ENTER_COURSE_FROM_CARD_ERROR]', error);

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
      className={`group h-full ${className}`}
    >
      <SiteCard
        variant='default'
        padding='none'
        radius='md'
        hover
        className='flex h-full flex-col'
      >
        {/* Cover */}
        <Link
          href={detailHref}
          aria-label={`مشاهده دوره ${course.title}`}
          className='relative block aspect-video overflow-hidden'
        >
          {course?.cover ? (
            <Image
              src={course.cover}
              alt={course.title}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              className='object-cover transition-transform duration-700 ease-out group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-secondary/10 text-secondary'>
              <HiOutlineBookOpen size={44} />
            </div>
          )}

          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent' />

          <div className='absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3'>
            <SiteBadge
              icon={HiOutlinePlayCircle}
              variant='neutral'
              size='sm'
              className='border-white/20 bg-black/25 text-white backdrop-blur-md dark:border-white/20 dark:bg-black/25 dark:text-white'
            >
              دوره آموزشی
            </SiteBadge>

            <span className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-secondary'>
              <HiOutlineArrowLeft
                size={17}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </span>
          </div>

          {(showSubscriptionBadgeOnly || showSubscriptionBadgeAlso) && (
            <div className='absolute right-3 top-3 z-10'>
              {showSubscriptionBadgeOnly && <SubscriptionBadge type='ONLY' />}

              {showSubscriptionBadgeAlso && <SubscriptionBadge type='ALSO' />}
            </div>
          )}
        </Link>

        {/* Content */}
        <div className='relative flex flex-1 flex-col p-4 sm:p-5'>
          <div
            aria-hidden='true'
            className='absolute -right-20 -top-16 h-32 w-32 rounded-full bg-secondary/10 blur-[50px] transition-transform duration-500 group-hover:scale-125'
          />

          <div className='relative z-10 flex h-full flex-col'>
            <Link href={detailHref}>
              <h2 className='line-clamp-2 min-h-[54px] text-base font-black leading-7 text-text-light transition-colors duration-300 group-hover:text-secondary sm:text-lg dark:text-text-dark'>
                {course.title}
              </h2>
            </Link>

            {course?.subtitle && (
              <p className='mt-2 line-clamp-2 min-h-[48px] text-xs leading-6 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                {course.subtitle}
              </p>
            )}

            {hasAccess && (
              <SiteBadge
                icon={HiOutlineCheckBadge}
                variant='success'
                size='md'
                className='mt-3.5 max-w-full justify-start rounded-xl'
              >
                {accessText}
              </SiteBadge>
            )}

            <div className='mt-auto pt-4'>
              <div className='mb-4 h-px w-full bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

              {hasAccess ? (
                <div className='flex items-center gap-2'>
                  <SiteButton
                    type='button'
                    variant='primary'
                    size='md'
                    startIcon={HiOutlinePlayCircle}
                    loading={isEnterCourseLoading}
                    disabled={isEnterCourseLoading}
                    onClick={handleEnterCourse}
                    className='min-w-0 flex-1'
                  >
                    {isEnterCourseLoading ? 'در حال ورود...' : 'ادامه دوره'}
                  </SiteButton>

                  <SiteIconButton
                    href={detailHref}
                    icon={HiOutlineBookOpen}
                    size='md'
                    variant='secondary'
                    ariaLabel={`جزئیات دوره ${course.title}`}
                    title='مشاهده جزئیات دوره'
                  />
                </div>
              ) : (
                <>
                  {!isSubscriptionOnly && (
                    <Price
                      finalPrice={course.finalPrice}
                      price={course.price}
                      discount={course.discount}
                      className='mb-4'
                    />
                  )}

                  <CardActions
                    mainBtnClick={() => router.push(detailHref)}
                    courseId={course.id}
                    subscriptionMode={course.pricingMode}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </SiteCard>
    </motion.article>
  );
};

CourseCard.propTypes = {
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

export default CourseCard;
