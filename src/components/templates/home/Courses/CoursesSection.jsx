// src/components/templates/home/Courses/CoursesSection.jsx

/* eslint-disable no-undef */

import { headers } from 'next/headers';
import Link from 'next/link';
import React from 'react';
import CoursesSwiperCarousel from './CoursesSwiperCarousel';

import {
  HiOutlineArrowLeft,
  HiOutlineAcademicCap,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { GrYoga } from 'react-icons/gr';

const fetchCourseData = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 7200,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch course data');
  }

  return response.json();
};

async function CoursesSection() {
  const response = await fetchCourseData();

  const courses = Array.isArray(response?.data) ? response.data : [];

  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light py-12 transition-colors duration-300 sm:py-16 lg:py-20 dark:bg-background-dark'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-52 top-0 h-[520px] w-[520px] rounded-full bg-secondary/10 blur-[150px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-52 bottom-0 h-[470px] w-[470px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/30 to-transparent' />

        <div className='courses-background-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />

        <div className='courses-floating-orbit absolute -right-28 top-24 h-72 w-72 rounded-full border border-dashed border-secondary/15' />

        <div className='courses-floating-orbit-reverse border-yellow/15 absolute -left-24 bottom-8 h-64 w-64 rounded-full border border-dashed' />

        <svg
          viewBox='0 0 320 320'
          fill='none'
          className='absolute right-[8%] top-[16%] h-64 w-64 text-secondary opacity-[0.035] dark:opacity-[0.06]'
        >
          <circle
            cx='160'
            cy='160'
            r='125'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeDasharray='7 10'
          />

          <circle
            cx='160'
            cy='160'
            r='84'
            stroke='currentColor'
            strokeWidth='1.5'
          />

          <path
            d='M160 42C174 99 203 128 260 142C203 156 174 185 160 242C146 185 117 156 60 142C117 128 146 99 160 42Z'
            stroke='currentColor'
            strokeWidth='1.5'
          />
        </svg>
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='relative overflow-hidden rounded-[32px] border border-black/5 bg-surface-light/75 px-4 py-8 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[40px] sm:px-7 sm:py-11 lg:px-10 lg:py-14 dark:border-white/10 dark:bg-surface-dark/70 dark:shadow-[0_30px_100px_rgba(0,0,0,0.28)]'>
          <div
            aria-hidden='true'
            className='absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-secondary/55 to-transparent'
          />

          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/10 absolute -bottom-32 left-[18%] h-72 w-72 rounded-full blur-[110px]'
          />

          <div className='relative z-10 mb-9 flex flex-col gap-7 lg:mb-12 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-3xl'>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
                <HiOutlineSparkles size={18} />

                <span>مسیرهای آموزشی سمانه یوگا</span>
              </div>

              <h2 className='text-3xl font-black leading-[1.65] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
                دوره‌ای متناسب با
                <span className='relative mx-2 inline-block text-secondary'>
                  مسیر شما
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 170 18'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-1 right-0 h-3 w-full'
                  >
                    <path
                      d='M4 12C36 4 68 16 101 9C126 4 147 5 166 9'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='4'
                      strokeLinecap='round'
                      opacity='0.75'
                    />
                  </svg>
                </span>
              </h2>

              <p className='mt-5 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 dark:text-subtext-dark'>
                از تمرین‌های پایه تا مسیرهای تخصصی، دوره‌ها به‌صورت
                مرحله‌به‌مرحله طراحی شده‌اند تا با آرامش و استمرار پیشرفت کنید.
              </p>

              <div className='mt-6 flex flex-wrap items-center gap-3'>
                <div className='flex items-center gap-2 rounded-2xl border border-black/5 bg-background-light/70 px-4 py-3 text-xs font-bold text-text-light shadow-sm dark:border-white/10 dark:bg-background-dark/55 dark:text-text-dark'>
                  <HiOutlinePlayCircle size={20} className='text-secondary' />

                  <span>آموزش ویدیویی</span>
                </div>

                <div className='flex items-center gap-2 rounded-2xl border border-black/5 bg-background-light/70 px-4 py-3 text-xs font-bold text-text-light shadow-sm dark:border-white/10 dark:bg-background-dark/55 dark:text-text-dark'>
                  <HiOutlineAcademicCap size={20} className='text-yellow' />

                  <span>مناسب همه سطوح</span>
                </div>

                {courses.length > 0 && (
                  <div className='flex items-center gap-2 rounded-2xl border border-secondary/15 bg-secondary/10 px-4 py-3 text-xs font-bold text-secondary'>
                    <span className='font-faNa text-sm'>
                      {courses.length.toLocaleString('fa-IR')}
                    </span>

                    <span>دوره آموزشی</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              href='/courses'
              className='group hidden h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-secondary/20 bg-secondary/10 px-6 text-sm font-bold text-secondary transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-secondary hover:text-white lg:flex'
            >
              <GrYoga size={21} />

              <span>مشاهده همه دوره‌ها</span>

              <HiOutlineArrowLeft
                size={19}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>

          <div className='relative z-10'>
            <CoursesSwiperCarousel courses={courses} />
          </div>

          <div className='relative z-10 mt-8 flex justify-center lg:hidden'>
            <Link
              href='/courses'
              className='group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 text-sm font-bold text-white shadow-[0_16px_40px_rgba(38,145,125,0.24)] transition-all duration-300 hover:-translate-y-1 sm:w-auto'
            >
              <span>مشاهده همه دوره‌ها</span>

              <HiOutlineArrowLeft
                size={19}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .courses-background-grid {
          background-image:
            linear-gradient(
              rgba(100, 244, 171, 0.25) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(100, 244, 171, 0.25) 1px,
              transparent 1px
            );
          background-size: 64px 64px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            black 18%,
            black 80%,
            transparent
          );
        }

        @keyframes coursesOrbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes coursesOrbitReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        .courses-floating-orbit {
          animation: coursesOrbit 32s linear infinite;
        }

        .courses-floating-orbit-reverse {
          animation: coursesOrbitReverse 28s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .courses-floating-orbit,
          .courses-floating-orbit-reverse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

export default CoursesSection;
