'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { motion } from 'framer-motion';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineHeart,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const DEFAULT_TEACHING_IMAGE = '/images/home/samaneh-teacher.webp';

const features = [
  {
    id: 1,

    title: 'آموزش اصولی و مرحله‌به‌مرحله',

    description:
      'تمرین‌ها از پایه طراحی شده‌اند تا بدون سردرگمی و با اطمینان پیشرفت کنید.',

    icon: HiOutlineAcademicCap,
  },

  {
    id: 2,

    title: 'مناسب برای هر سطح',

    description:
      'چه تازه‌کار باشید و چه تجربه داشته باشید، مسیر متناسب با سطح خودتان را پیدا می‌کنید.',

    icon: HiOutlineCheckBadge,
  },

  {
    id: 3,

    title: 'تعادل میان جسم و ذهن',

    description:
      'هدف فقط اجرای حرکات نیست؛ تمرین‌ها برای ایجاد آرامش، تمرکز و آگاهی طراحی شده‌اند.',

    icon: HiOutlineHeart,
  },
];

const containerVariants = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const TeachingMethodSection = () => {
  const [imageUrl, setImageUrl] = useState(DEFAULT_TEACHING_IMAGE);

  /*
    |--------------------------------------------------------------------------
    | Site Setting
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

        const data = await response.json();

        /*
         * URL آماده نمایش که API می‌سازد.
         */
        const resolvedUrl = String(data?.teachingMethodImageUrl || '').trim();

        if (!disposed && resolvedUrl) {
          setImageUrl(resolvedUrl);
        }
      } catch (error) {
        console.error('[TEACHING_METHOD_SITE_INFO_ERROR]', error);
      }
    };

    loadSiteInfo();

    return () => {
      disposed = true;
    };
  }, []);

  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light py-14 transition-colors duration-300 sm:py-20 lg:py-24 dark:bg-background-dark'
    >
      {/* Background */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-52 top-10 h-[520px] w-[520px] rounded-full bg-secondary/10 blur-[150px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-52 bottom-0 h-[480px] w-[480px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

        <div className='teaching-method-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <SiteCard
          as='div'
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='relative overflow-hidden px-5 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-12'
        >
          {/* Internal glow */}
          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/10 absolute -bottom-32 left-[15%] h-72 w-72 rounded-full blur-[110px]'
          />

          <div className='relative z-10 grid items-center gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12 xl:gap-16'>
            {/* ======================
                  Visual
              ====================== */}
            <motion.div
              initial={{
                opacity: 0,
                x: 35,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.65,
                ease: 'easeOut',
              }}
              className='relative order-1 flex items-center justify-center lg:order-2'
            >
              <div className='relative aspect-[5/6] w-full max-w-[455px] sm:max-w-[520px] lg:max-w-[570px] xl:max-w-[610px]'>
                {/* Glow */}
                <div
                  aria-hidden='true'
                  className='teaching-method-breathe absolute inset-[7%] rounded-[42%_58%_48%_52%/46%_43%_57%_54%] bg-secondary/20 blur-[80px]'
                />

                {/* Outer orbit */}
                <div
                  aria-hidden='true'
                  className='teaching-method-orbit absolute -inset-3 rounded-[45%_55%_44%_56%/48%_42%_58%_52%] border border-dashed border-secondary/25 sm:-inset-5'
                >
                  <span className='absolute left-[6%] top-[20%] h-3.5 w-3.5 rounded-full bg-secondary shadow-[0_0_18px_rgba(38,145,125,0.7)]' />

                  <span className='bg-yellow absolute bottom-[10%] right-[18%] h-3 w-3 rounded-full shadow-[0_0_16px_rgba(245,185,66,0.7)]' />
                </div>

                {/* Inner orbit */}
                <div
                  aria-hidden='true'
                  className='teaching-method-orbit-reverse absolute inset-[3%] rounded-[50%_50%_44%_56%/45%_48%_52%_55%] border border-secondary/15'
                />

                {/* Main image */}
                <div className='absolute inset-[5%] overflow-hidden rounded-[42%_58%_48%_52%/45%_42%_58%_55%] border-[7px] border-surface-light bg-surface-light shadow-[0_35px_95px_rgba(15,23,42,0.20)] dark:border-surface-dark dark:bg-surface-dark dark:shadow-[0_40px_105px_rgba(0,0,0,0.42)]'>
                  <Image
                    key={imageUrl}
                    src={imageUrl}
                    alt='سمانه، مدرس بین‌المللی یوگا و مدیتیشن'
                    fill
                    priority={false}
                    sizes='(max-width: 640px) 420px, (max-width: 1024px) 500px, 570px'
                    className='object-cover object-center transition-transform duration-700 hover:scale-[1.035]'
                    onError={() => {
                      if (imageUrl !== DEFAULT_TEACHING_IMAGE) {
                        setImageUrl(DEFAULT_TEACHING_IMAGE);
                      }
                    }}
                  />

                  <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5' />
                </div>

                {/* Teacher card */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 16,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.25,
                  }}
                  className='teaching-method-floating-card absolute bottom-[1%] right-0 z-20'
                >
                  <SiteCard
                    variant='glass'
                    padding='none'
                    radius='md'
                    className='flex max-w-[255px] items-center gap-3 p-3 sm:p-4'
                  >
                    <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                      <HiOutlineAcademicCap size={25} />
                    </span>

                    <div className='text-right'>
                      <p className='text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                        سمانه
                      </p>

                      <p className='mt-1 text-[10px] leading-5 text-subtext-light sm:text-xs dark:text-subtext-dark'>
                        مدرس بین‌المللی یوگا و مدیتیشن
                      </p>
                    </div>
                  </SiteCard>
                </motion.div>

                {/* Sparkle */}
                <div className='teaching-method-sparkle border-yellow/20 bg-yellow/10 text-yellow absolute left-[0%] top-[12%] z-20 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md sm:h-16 sm:w-16'>
                  <HiOutlineSparkles size={29} />
                </div>
              </div>
            </motion.div>

            {/* ======================
                  Content
              ====================== */}
            <motion.div
              variants={containerVariants}
              initial='hidden'
              whileInView='visible'
              viewport={{
                once: true,
                amount: 0.15,
              }}
              className='order-2 text-center lg:order-1 lg:text-right'
            >
              <motion.div variants={itemVariants}>
                <SiteBadge variant='secondary' size='md'>
                  <span className='flex items-center gap-2'>
                    <HiOutlineSparkles size={17} />
                    روش آموزش سمانه
                  </span>
                </SiteBadge>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                className='mt-4 text-2xl font-black leading-[1.8] text-text-light sm:text-3xl lg:text-[40px] lg:leading-[1.75] dark:text-text-dark'
              >
                آموزش فقط اجرای حرکت نیست؛
                <br />
                <span className='relative inline-block text-secondary'>
                  مسیری برای شناخت خودت
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 260 22'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                  >
                    <path
                      d='M5 14C54 4 102 18 151 10C191 4 223 6 255 11'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='5'
                      strokeLinecap='round'
                      opacity='0.8'
                    />

                    <path
                      d='M25 19C74 14 126 19 183 14'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      opacity='0.35'
                    />
                  </svg>
                </span>
              </motion.h2>

              <motion.p
                variants={itemVariants}
                className='mx-auto mt-5 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 lg:mx-0 dark:text-subtext-dark'
              >
                تمرین‌ها به شکلی طراحی شده‌اند که بدون فشار و مقایسه، در مسیر
                خودتان پیش بروید. هر آموزش از پایه شروع می‌شود و با توضیحات
                دقیق، شما را برای اجرای آگاهانه و ایمن تمرین همراهی می‌کند.
              </motion.p>

              {/* Features */}
              <motion.div
                variants={containerVariants}
                className='mt-7 grid gap-3'
              >
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <motion.div
                      key={feature.id}
                      variants={itemVariants}
                      whileHover={{
                        x: -4,
                      }}
                    >
                      <SiteCard
                        as='article'
                        variant='glass'
                        padding='none'
                        radius='md'
                        className='group relative overflow-hidden p-4 text-right sm:p-5'
                      >
                        <div
                          aria-hidden='true'
                          className='absolute -right-16 -top-16 h-32 w-32 rounded-full bg-secondary/10 blur-[55px] transition-all duration-300 group-hover:bg-secondary/15'
                        />

                        <div className='relative flex items-start gap-4'>
                          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:scale-105 group-hover:bg-secondary group-hover:text-white sm:h-12 sm:w-12'>
                            <Icon size={24} />
                          </span>

                          <div>
                            <h3 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                              {feature.title}
                            </h3>

                            <p className='mt-1.5 text-xs leading-6 text-subtext-light sm:text-sm sm:leading-7 dark:text-subtext-dark'>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </SiteCard>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Actions */}
              <motion.div
                variants={itemVariants}
                className='mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start'
              >
                <SiteButton
                  href='/courses'
                  variant='primary'
                  size='lg'
                  startIcon={HiOutlinePlayCircle}
                  endIcon={HiOutlineArrowLeft}
                  className='w-full sm:w-auto'
                >
                  مشاهده دوره‌ها
                </SiteButton>

                <div className='flex items-center gap-2 text-xs font-bold text-subtext-light dark:text-subtext-dark'>
                  <HiOutlineCheckBadge size={20} className='text-yellow' />

                  <span>شروع مسیر متناسب با سطح شما</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </SiteCard>
      </div>
    </section>
  );
};

export default TeachingMethodSection;
