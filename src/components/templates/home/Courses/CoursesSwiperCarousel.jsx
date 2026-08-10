// src/components/templates/home/Courses/CoursesSwiperCarousel.jsx

/* eslint-disable react/no-unknown-property */

'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import CourseCard from '@/components/CourseCards/CourseCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteIconButton from '@/components/SiteUi/Button/SiteIconButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';

const CoursesSwiperCarousel = ({ courses }) => {
  const [swiperInstance, setSwiperInstance] = useState(null);

  const normalizedCourses = useMemo(() => {
    return Array.isArray(courses) ? courses.filter((course) => course?.id) : [];
  }, [courses]);

  const hasCourses = normalizedCourses.length > 0;
  const canAutoplay = normalizedCourses.length > 1;
  const canLoop = normalizedCourses.length > 3;

  const handlePreviousSlide = () => {
    swiperInstance?.slidePrev();
  };

  const handleNextSlide = () => {
    swiperInstance?.slideNext();
  };

  if (!hasCourses) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        <SiteCard
          variant='soft'
          padding='lg'
          radius='lg'
          className='border-dashed py-14 text-center'
        >
          <div
            aria-hidden='true'
            className='absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[75px]'
          />

          <div className='relative z-10 mx-auto flex max-w-md flex-col items-center'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineBookOpen size={32} />
            </div>

            <h3 className='text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
              دوره‌ای برای نمایش وجود ندارد
            </h3>

            <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
              به‌زودی دوره‌های جدید یوگا و مدیتیشن در سامانه منتشر می‌شوند.
            </p>

            <SiteButton
              href='/courses'
              variant='primary'
              size='md'
              endIcon={HiOutlineArrowLeft}
              className='mt-6'
            >
              مشاهده صفحه دوره‌ها
            </SiteButton>
          </div>
        </SiteCard>
      </motion.div>
    );
  }

  return (
    <div dir='rtl' className='w-full'>
      <div className='mb-5 flex items-center justify-between gap-4 sm:mb-7'>
        <div className='flex items-center gap-3'>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlinePlayCircle size={24} />
          </div>

          <div>
            <h3 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              دوره‌های منتخب
            </h3>
            <p className='mt-1 text-[11px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
              دوره مناسب خود را انتخاب کنید
            </p>
          </div>
        </div>

        {normalizedCourses.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className='hidden items-center gap-2 sm:flex'
          >
            <SiteIconButton
              icon={HiOutlineChevronRight}
              ariaLabel='دوره قبلی'
              variant='secondary'
              size='md'
              onClick={handlePreviousSlide}
              disabled={!swiperInstance}
            />

            <SiteIconButton
              icon={HiOutlineChevronLeft}
              ariaLabel='دوره بعدی'
              variant='secondary'
              size='md'
              onClick={handleNextSlide}
              disabled={!swiperInstance}
            />
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className='courses-swiper-wrapper relative'
      >
        <Swiper
          modules={[Autoplay, Pagination]}
          onSwiper={setSwiperInstance}
          slidesPerView={1.08}
          spaceBetween={14}
          loop={canLoop}
          speed={750}
          grabCursor
          watchOverflow
          observer
          observeParents
          autoplay={
            canAutoplay
              ? {
                  delay: 3800,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            480: { slidesPerView: 1.25, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 18 },
            768: { slidesPerView: 2.2, spaceBetween: 18 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 3.2, spaceBetween: 22 },
          }}
          className='courses-swiper'
        >
          {normalizedCourses.map((course, index) => (
            <SwiperSlide key={course.id} className='h-auto py-3'>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(index * 0.07, 0.35),
                  ease: 'easeOut',
                }}
                whileHover={{ y: -8 }}
                className='course-slide-card group relative h-full rounded-[28px]'
              >
                <div
                  aria-hidden='true'
                  className='course-slide-glow pointer-events-none absolute -inset-px -z-10 rounded-[29px] bg-gradient-to-br from-secondary/35 via-transparent to-primary/25 opacity-0 blur-sm transition-opacity duration-300'
                />

                <CourseCard
                  course={course}
                  className='h-full min-h-[480px] overflow-hidden rounded-[28px] border border-black/5 bg-background-light/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:border-secondary/20 group-hover:shadow-[0_26px_70px_rgba(15,23,42,0.13)] dark:border-white/10 dark:bg-background-dark/65 dark:shadow-[0_20px_55px_rgba(0,0,0,0.22)] dark:group-hover:border-secondary/30'
                />
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-4 bottom-12 top-3 z-10 hidden w-12 bg-gradient-to-l from-surface-light via-surface-light/70 to-transparent sm:-right-7 sm:block lg:-right-10 dark:from-surface-dark dark:via-surface-dark/70'
        />
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -left-4 bottom-12 top-3 z-10 hidden w-12 bg-gradient-to-r from-surface-light via-surface-light/70 to-transparent sm:-left-7 sm:block lg:-left-10 dark:from-surface-dark dark:via-surface-dark/70'
        />
      </motion.div>

      <style jsx global>{`
        .courses-swiper {
          overflow: visible;
          padding: 2px 4px 52px;
        }

        .courses-swiper .swiper-wrapper {
          align-items: stretch;
        }

        .courses-swiper .swiper-slide {
          display: flex;
          height: auto;
        }

        .courses-swiper .swiper-slide > div {
          width: 100%;
        }

        .courses-swiper .swiper-pagination {
          bottom: 5px !important;
        }

        .courses-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(38, 145, 125, 0.28);
          opacity: 1;
          transition: all 0.3s ease;
        }

        .courses-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 999px;
          background: rgb(38 145 125);
        }

        .course-slide-card:hover .course-slide-glow {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

CoursesSwiperCarousel.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.object),
};

CoursesSwiperCarousel.defaultProps = {
  courses: [],
};

export default CoursesSwiperCarousel;
