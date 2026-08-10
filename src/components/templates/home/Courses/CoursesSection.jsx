// src/components/templates/home/Courses/CoursesSection.jsx

/* eslint-disable no-undef */

import { headers } from 'next/headers';
import React from 'react';

import CoursesSwiperCarousel from './CoursesSwiperCarousel';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SectionHeader from '@/components/SiteUi/SectionHeader/SectionHeader';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
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
        <div className='absolute -left-52 bottom-0 h-[470px] w-[470px] rounded-full bg-primary/10 blur-[150px] dark:bg-primary/5' />
        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/30 to-transparent' />
        <div className='courses-background-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />
        <div className='courses-floating-orbit absolute -right-28 top-24 h-72 w-72 rounded-full border border-dashed border-secondary/15' />
        <div className='courses-floating-orbit-reverse absolute -left-24 bottom-8 h-64 w-64 rounded-full border border-dashed border-primary/15' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='px-4 py-8 sm:px-7 sm:py-11 lg:px-10 lg:py-14'
        >
          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]'
          />
          <div
            aria-hidden='true'
            className='absolute -bottom-32 left-[18%] h-72 w-72 rounded-full bg-primary/10 blur-[110px]'
          />

          <SectionHeader
            icon={HiOutlineSparkles}
            eyebrow='مسیرهای آموزشی سامانه یوگا'
            title={
              <span className='block text-3xl font-black leading-[1.65] sm:text-4xl lg:text-5xl'>
                دوره‌ای متناسب با{' '}
                <span className='text-secondary'>مسیر شما</span>
              </span>
            }
            description='از تمرین‌های پایه تا مسیرهای تخصصی، دوره‌ها به‌صورت مرحله‌به‌مرحله طراحی شده‌اند تا با آرامش و استمرار پیشرفت کنید.'
            action={
              <SiteButton
                href='/courses'
                variant='secondary'
                size='lg'
                startIcon={GrYoga}
                endIcon={HiOutlineArrowLeft}
                className='hidden lg:inline-flex'
              >
                مشاهده همه دوره‌ها
              </SiteButton>
            }
            className='relative z-10 mb-6 lg:mb-7'
          />

          <div className='relative z-10 mb-9 flex flex-wrap items-center gap-2 lg:mb-12'>
            <SiteBadge
              icon={HiOutlinePlayCircle}
              variant='neutral'
              size='lg'
            >
              آموزش ویدیویی
            </SiteBadge>

            <SiteBadge
              icon={HiOutlineAcademicCap}
              variant='yellow'
              size='lg'
            >
              مناسب همه سطوح
            </SiteBadge>

            {courses.length > 0 && (
              <SiteBadge variant='secondary' size='lg'>
                <span className='font-faNa'>
                  {courses.length.toLocaleString('fa-IR')}
                </span>{' '}
                دوره آموزشی
              </SiteBadge>
            )}
          </div>

          <div className='relative z-10'>
            <CoursesSwiperCarousel courses={courses} />
          </div>

          <div className='relative z-10 mt-8 flex justify-center lg:hidden'>
            <SiteButton
              href='/courses'
              variant='primary'
              size='lg'
              startIcon={GrYoga}
              endIcon={HiOutlineArrowLeft}
              fullWidth
              className='sm:w-auto'
            >
              مشاهده همه دوره‌ها
            </SiteButton>
          </div>
        </SiteCard>
      </div>

      <style>{`
        .courses-background-grid {
          background-image:
            linear-gradient(rgba(100, 244, 171, 0.25) 1px, transparent 1px),
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
