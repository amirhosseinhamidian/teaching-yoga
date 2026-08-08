// src/components/templates/home/FinalCTA/FinalCTASection.jsx

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { MdSelfImprovement } from 'react-icons/md';

const benefits = [
  'شروع از سطح مناسب شما',
  'آموزش اصولی و مرحله‌به‌مرحله',
  'دسترسی آسان در موبایل و کامپیوتر',
];

const FinalCTASection = () => {
  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light py-16 transition-colors duration-300 sm:py-20 lg:py-28 dark:bg-background-dark'
    >
      {/* Background decorations */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-52 top-0 h-[520px] w-[520px] rounded-full bg-secondary/10 blur-[160px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-52 bottom-0 h-[480px] w-[480px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

        <div className='final-cta-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.7,
            ease: 'easeOut',
          }}
          className='to-yellow/[0.09] dark:to-yellow/[0.06] relative overflow-hidden rounded-[34px] border border-secondary/20 bg-gradient-to-br from-secondary/[0.13] via-surface-light/90 px-5 py-9 shadow-[0_30px_100px_rgba(38,145,125,0.13)] backdrop-blur-xl sm:rounded-[44px] sm:px-8 sm:py-12 lg:px-12 lg:py-14 dark:border-secondary/20 dark:from-secondary/[0.16] dark:via-surface-dark/90 dark:shadow-[0_35px_110px_rgba(0,0,0,0.32)]'
        >
          {/* Internal decorations */}
          <div
            aria-hidden='true'
            className='absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent'
          />

          <div
            aria-hidden='true'
            className='absolute -right-32 -top-32 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/15 absolute -bottom-36 left-[22%] h-80 w-80 rounded-full blur-[110px]'
          />

          <div
            aria-hidden='true'
            className='final-cta-orbit absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border border-dashed border-secondary/15'
          />

          <div className='relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:gap-14'>
            {/* Content */}
            <motion.div
              initial={{
                opacity: 0,
                x: 30,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.65,
                delay: 0.1,
                ease: 'easeOut',
              }}
              className='text-center lg:text-right'
            >
              <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
                <HiOutlineSparkles size={18} />

                <span>اولین قدم از همین‌جا شروع می‌شود</span>
              </div>

              <h2 className='text-3xl font-black leading-[1.75] text-text-light sm:text-4xl lg:text-5xl lg:leading-[1.65] dark:text-text-dark'>
                آماده‌ای مسیر
                <span className='relative mx-2 inline-block text-secondary'>
                  آرامش و آگاهی
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 270 24'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                  >
                    <path
                      d='M6 15C58 4 108 19 159 10C201 3 237 7 264 12'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='5'
                      strokeLinecap='round'
                      opacity='0.82'
                    />

                    <path
                      d='M26 20C80 14 131 20 198 14'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      opacity='0.36'
                    />
                  </svg>
                </span>
                را شروع کنی؟
              </h2>

              <p className='mx-auto mt-6 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 lg:mx-0 dark:text-subtext-dark'>
                لازم نیست از قبل آماده یا حرفه‌ای باشی؛ فقط کافی است اولین قدم
                را برداری و با یک مسیر اصولی، تمرین یوگا و مدیتیشن را وارد زندگی
                روزمره‌ات کنی.
              </p>

              <div className='mt-7 grid gap-3 sm:grid-cols-3 lg:max-w-3xl'>
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
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
                      duration: 0.45,
                      delay: 0.2 + index * 0.08,
                    }}
                    className='flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-surface-light/60 px-3 py-3 text-xs font-bold leading-6 text-text-light backdrop-blur-md sm:text-sm lg:justify-start dark:border-white/10 dark:bg-surface-dark/55 dark:text-text-dark'
                  >
                    <HiOutlineCheckBadge
                      size={19}
                      className='shrink-0 text-secondary'
                    />

                    <span>{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start'>
                <Link
                  href='/courses'
                  className='group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-7 text-sm font-bold text-white shadow-[0_18px_45px_rgba(38,145,125,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(38,145,125,0.38)] sm:w-auto'
                >
                  <HiOutlinePlayCircle size={22} />

                  <span>شروع یادگیری</span>

                  <HiOutlineArrowLeft
                    size={19}
                    className='transition-transform duration-300 group-hover:-translate-x-1'
                  />
                </Link>

                <Link
                  href='/courses'
                  className='group flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-secondary/25 bg-surface-light/60 px-7 text-sm font-bold text-secondary backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-secondary/10 sm:w-auto dark:bg-surface-dark/55'
                >
                  <HiOutlineBookOpen size={21} />

                  <span>مشاهده دوره‌ها</span>
                </Link>
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.92,
                x: -25,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.25,
              }}
              transition={{
                duration: 0.7,
                delay: 0.15,
                ease: 'easeOut',
              }}
              className='relative mx-auto flex h-[340px] w-full max-w-[420px] items-center justify-center sm:h-[400px]'
            >
              <div
                aria-hidden='true'
                className='absolute h-[290px] w-[290px] rounded-full bg-secondary/10 blur-[35px] sm:h-[340px] sm:w-[340px]'
              />

              <div
                aria-hidden='true'
                className='final-cta-visual-orbit absolute h-[280px] w-[280px] rounded-full border border-dashed border-secondary/30 sm:h-[340px] sm:w-[340px]'
              />

              <div
                aria-hidden='true'
                className='final-cta-visual-orbit-reverse border-yellow/30 absolute h-[225px] w-[225px] rounded-full border border-dashed sm:h-[275px] sm:w-[275px]'
              />

              <div
                aria-hidden='true'
                className='to-yellow/20 absolute h-[175px] w-[175px] rounded-full bg-gradient-to-br from-secondary/25 via-secondary/10 shadow-[0_25px_80px_rgba(38,145,125,0.20)] sm:h-[210px] sm:w-[210px]'
              />

              <div className='relative flex h-[145px] w-[145px] items-center justify-center rounded-[48px] border border-white/40 bg-surface-light/70 text-secondary shadow-[0_28px_80px_rgba(38,145,125,0.22)] backdrop-blur-xl sm:h-[175px] sm:w-[175px] sm:rounded-[58px] dark:border-white/10 dark:bg-surface-dark/70'>
                <MdSelfImprovement className='text-[82px] sm:text-[100px]' />
              </div>

              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className='absolute right-4 top-14 flex items-center gap-2 rounded-2xl border border-secondary/20 bg-surface-light/80 px-3 py-2 text-xs font-bold text-secondary shadow-lg backdrop-blur-md sm:right-5 sm:top-12 dark:bg-surface-dark/80'
              >
                <HiOutlineSparkles size={18} />

                <span>آرامش ذهن</span>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 9, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.7,
                }}
                className='border-yellow/20 absolute bottom-14 left-1 flex items-center gap-2 rounded-2xl border bg-surface-light/80 px-3 py-2 text-xs font-bold text-text-light shadow-lg backdrop-blur-md sm:bottom-16 sm:left-4 dark:bg-surface-dark/80 dark:text-text-dark'
              >
                <HiOutlineCheckBadge size={18} className='text-yellow' />

                <span>تمرین آگاهانه</span>
              </motion.div>

              <span
                aria-hidden='true'
                className='final-cta-dot bg-yellow absolute left-14 top-10 h-3 w-3 rounded-full shadow-[0_0_18px_rgba(255,200,70,0.75)]'
              />

              <span
                aria-hidden='true'
                className='final-cta-dot-delayed absolute bottom-8 right-20 h-2.5 w-2.5 rounded-full bg-secondary shadow-[0_0_18px_rgba(38,145,125,0.7)]'
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes finalCtaOrbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes finalCtaOrbitReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes finalCtaPulse {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(0.8);
          }

          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .final-cta-orbit,
        .final-cta-visual-orbit {
          animation: finalCtaOrbit 34s linear infinite;
        }

        .final-cta-visual-orbit-reverse {
          animation: finalCtaOrbitReverse 27s linear infinite;
        }

        .final-cta-dot {
          animation: finalCtaPulse 3.6s ease-in-out infinite;
        }

        .final-cta-dot-delayed {
          animation: finalCtaPulse 3.6s ease-in-out 1.2s infinite;
        }

        .final-cta-grid {
          background-image:
            linear-gradient(rgba(100, 244, 171, 0.22) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(100, 244, 171, 0.22) 1px,
              transparent 1px
            );
          background-size: 68px 68px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            black 16%,
            black 84%,
            transparent
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .final-cta-orbit,
          .final-cta-visual-orbit,
          .final-cta-visual-orbit-reverse,
          .final-cta-dot,
          .final-cta-dot-delayed {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default FinalCTASection;
