// src/components/templates/home/Courses/CoursesSwiperCarousel.jsx

/* eslint-disable react/no-unknown-property */

'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import { motion } from 'framer-motion';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import CourseCard from '@/components/CourseCards/CourseCard';

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
        initial={{
          opacity: 0,
          scale: 0.98,
        }}
        whileInView={{
          opacity: 1,
          scale: 1,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          duration: 0.45,
        }}
        className='relative overflow-hidden rounded-[28px] border border-dashed border-secondary/25 bg-background-light/60 px-5 py-14 text-center dark:bg-background-dark/45'
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

          <Link
            href='/courses'
            className='group mt-6 flex h-12 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1'
          >
            <span>مشاهده صفحه دوره‌ها</span>

            <HiOutlineArrowLeft
              size={18}
              className='transition-transform duration-300 group-hover:-translate-x-1'
            />
          </Link>
        </div>
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
            initial={{
              opacity: 0,
              x: -10,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.4,
            }}
            className='hidden items-center gap-2 sm:flex'
          >
            <button
              type='button'
              onClick={handlePreviousSlide}
              disabled={!swiperInstance}
              aria-label='دوره قبلی'
              className='group flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-background-light/80 text-text-light shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-background-dark/70 dark:text-text-dark dark:hover:border-secondary/40 dark:hover:bg-secondary dark:hover:text-white'
            >
              <HiOutlineChevronRight
                size={22}
                className='transition-transform duration-300 group-hover:translate-x-0.5'
              />
            </button>

            <button
              type='button'
              onClick={handleNextSlide}
              disabled={!swiperInstance}
              aria-label='دوره بعدی'
              className='group flex h-11 w-11 items-center justify-center rounded-2xl border border-black/5 bg-background-light/80 text-text-light shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-background-dark/70 dark:text-text-dark dark:hover:border-secondary/40 dark:hover:bg-secondary dark:hover:text-white'
            >
              <HiOutlineChevronLeft
                size={22}
                className='transition-transform duration-300 group-hover:-translate-x-0.5'
              />
            </button>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{
          opacity: 0,
          y: 26,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.1,
        }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
        }}
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
            480: {
              slidesPerView: 1.25,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: 2,
              spaceBetween: 18,
            },
            768: {
              slidesPerView: 2.2,
              spaceBetween: 18,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 3.2,
              spaceBetween: 22,
            },
          }}
          className='courses-swiper'
        >
          {normalizedCourses.map((course, index) => (
            <SwiperSlide key={course.id} className='h-auto py-3'>
              <motion.div
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.1,
                }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(index * 0.07, 0.35),
                  ease: 'easeOut',
                }}
                whileHover={{
                  y: -8,
                }}
                className='course-slide-card group relative h-full rounded-[28px]'
              >
                <div
                  aria-hidden='true'
                  className='course-slide-glow to-yellow/25 pointer-events-none absolute -inset-px -z-10 rounded-[29px] bg-gradient-to-br from-secondary/35 via-transparent opacity-0 blur-sm transition-opacity duration-300'
                />

                <CourseCard
                  course={course}
                  className='h-full min-h-[480px] overflow-hidden rounded-[28px] border border-black/5 bg-background-light/80 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 group-hover:border-secondary/20 group-hover:shadow-[0_26px_70px_rgba(15,23,42,0.13)] dark:border-white/10 dark:bg-background-dark/65 dark:shadow-[0_20px_55px_rgba(0,0,0,0.22)] dark:group-hover:border-secondary/30 dark:group-hover:shadow-[0_28px_75px_rgba(0,0,0,0.34)]'
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
          width: 7px;
          height: 7px;
          margin: 0 4px !important;
          background: rgba(100, 116, 139, 0.35);
          opacity: 1;
          transition:
            width 250ms ease,
            background-color 250ms ease,
            transform 250ms ease;
        }

        .courses-swiper .swiper-pagination-bullet-active {
          width: 25px;
          border-radius: 9999px;
          background: #64f4ab;
        }

        .course-slide-card:hover .course-slide-glow {
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .courses-swiper .swiper-wrapper {
            transition-duration: 0ms !important;
          }

          .course-slide-card {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
};

CoursesSwiperCarousel.propTypes = {
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    })
  ),
};

CoursesSwiperCarousel.defaultProps = {
  courses: [],
};

export default CoursesSwiperCarousel;
