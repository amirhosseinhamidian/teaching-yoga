// src/components/templates/home/LearningJourney/LearningJourney.jsx

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineHeart,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const journeySteps = [
  {
    id: 1,
    number: '۰۱',
    title: 'شروع مسیر',
    description:
      'دوره مناسب سطح و هدفت را انتخاب کن و بدون نیاز به تجربه قبلی، اولین قدم را بردار.',
    icon: HiOutlinePlayCircle,
    accentClass: 'text-secondary',
    backgroundClass: 'bg-secondary/10',
    borderClass: 'border-secondary/20',
  },
  {
    id: 2,
    number: '۰۲',
    title: 'یادگیری آگاهانه',
    description:
      'حرکات، تنفس و اصول یوگا را با آموزش‌های دقیق و مرحله‌به‌مرحله یاد بگیر.',
    icon: HiOutlineAcademicCap,
    accentClass: 'text-yellow',
    backgroundClass: 'bg-yellow/10',
    borderClass: 'border-yellow/20',
  },
  {
    id: 3,
    number: '۰۳',
    title: 'رشد و تغییر',
    description:
      'با تمرین پیوسته، انعطاف، تمرکز، آرامش ذهن و شناخت بهتری از خودت به دست بیاور.',
    icon: HiOutlineSparkles,
    accentClass: 'text-secondary',
    backgroundClass: 'bg-secondary/10',
    borderClass: 'border-secondary/20',
  },
  {
    id: 4,
    number: '۰۴',
    title: 'سبک زندگی آگاهانه',
    description:
      'آموخته‌ها را وارد زندگی روزمره کن و یوگا را به بخشی پایدار از مسیر زندگی‌ات تبدیل کن.',
    icon: HiOutlineHeart,
    accentClass: 'text-yellow',
    backgroundClass: 'bg-yellow/10',
    borderClass: 'border-yellow/20',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const LearningJourney = () => {
  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light py-6 transition-colors duration-300 sm:py-10 lg:py-14 dark:bg-background-dark'
    >
      {/* Background decorations */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-52 top-10 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[150px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-52 bottom-0 h-[480px] w-[480px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

        <div className='learning-journey-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />

        <div className='learning-journey-orbit absolute -right-32 bottom-20 h-72 w-72 rounded-full border border-dashed border-secondary/15' />

        <div className='learning-journey-orbit-reverse border-yellow/15 absolute -left-28 top-24 h-64 w-64 rounded-full border border-dashed' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='relative overflow-hidden rounded-[32px] border border-black/5 bg-surface-light/75 px-4 py-9 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[40px] sm:px-8 sm:py-12 lg:px-10 lg:py-14 dark:border-white/10 dark:bg-surface-dark/70 dark:shadow-[0_30px_100px_rgba(0,0,0,0.28)]'>
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
            className='bg-yellow/10 absolute -bottom-32 left-[20%] h-72 w-72 rounded-full blur-[110px]'
          />

          {/* Section heading */}
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeOut',
            }}
            className='relative z-10 mx-auto mb-14 max-w-3xl text-center lg:mb-20'
          >
            <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
              <HiOutlineSparkles size={18} />

              <span>مسیر یادگیری شما</span>
            </div>

            <h2 className='text-3xl font-black leading-[1.7] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
              مسیر شما برای رسیدن به
              <span className='relative mx-2 inline-block text-secondary'>
                آرامش و آگاهی
                <svg
                  aria-hidden='true'
                  viewBox='0 0 250 22'
                  preserveAspectRatio='none'
                  className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                >
                  <path
                    d='M5 14C52 4 98 18 145 10C184 4 216 6 245 11'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    opacity='0.8'
                  />

                  <path
                    d='M24 19C72 14 122 19 178 14'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    opacity='0.35'
                  />
                </svg>
              </span>
            </h2>

            <p className='mx-auto mt-6 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 dark:text-subtext-dark'>
              یوگا فقط مجموعه‌ای از حرکات نیست؛ یک مسیر تدریجی برای شناخت بدن،
              آرام‌کردن ذهن و ساختن سبک زندگی آگاهانه است.
            </p>
          </motion.div>

          {/* Journey cards */}
          <motion.div
            variants={containerVariants}
            initial='hidden'
            whileInView='visible'
            viewport={{
              once: true,
              amount: 0.12,
            }}
            className='relative z-10'
          >
            {/* Desktop connecting line */}
            <div
              aria-hidden='true'
              className='absolute left-[12%] right-[12%] top-[42px] hidden h-[2px] lg:block'
            >
              <div className='via-yellow/55 absolute inset-0 bg-gradient-to-l from-secondary/20 to-secondary/20' />

              <div className='learning-journey-line absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-transparent via-white/90 to-transparent blur-[1px]' />
            </div>

            {/* Mobile connecting line */}
            <div
              aria-hidden='true'
              className='via-yellow/50 absolute bottom-14 right-[27px] top-11 w-[2px] bg-gradient-to-b from-secondary/20 to-secondary/20 lg:hidden'
            >
              <div className='learning-journey-line-mobile absolute left-0 top-0 h-24 w-full bg-gradient-to-b from-transparent via-white/90 to-transparent blur-[1px]' />
            </div>

            <div className='grid gap-5 lg:grid-cols-4 lg:gap-4 xl:gap-6'>
              {journeySteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.article
                    key={step.id}
                    variants={cardVariants}
                    whileHover={{
                      y: -9,
                    }}
                    className='group relative pr-[76px] lg:pr-0'
                  >
                    {/* Timeline point */}
                    <div
                      className={`absolute right-0 top-0 z-20 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-[0_12px_32px_rgba(15,23,42,0.10)] backdrop-blur-md transition-all duration-500 group-hover:scale-110 lg:relative lg:mx-auto lg:mb-7 lg:h-[84px] lg:w-[84px] lg:rounded-[28px] ${step.backgroundClass} ${step.borderClass} ${step.accentClass} dark:shadow-[0_14px_36px_rgba(0,0,0,0.28)]`}
                    >
                      <span
                        aria-hidden='true'
                        className='absolute inset-2 rounded-[20px] border border-current opacity-10'
                      />

                      <Icon
                        size={index === 0 ? 30 : 29}
                        className='relative z-10 transition-transform duration-500 group-hover:scale-110'
                      />

                      <span className='absolute -left-1 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-surface-light px-1 font-faNa text-[10px] font-black text-text-light shadow-md dark:bg-surface-dark dark:text-text-dark'>
                        {step.number}
                      </span>
                    </div>

                    {/* Card */}
                    <div className='relative min-h-[190px] overflow-hidden rounded-[26px] border border-black/5 bg-background-light/65 p-5 text-right shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-md transition-all duration-500 group-hover:border-secondary/25 group-hover:shadow-[0_24px_65px_rgba(15,23,42,0.11)] sm:p-6 lg:min-h-[250px] lg:text-center dark:border-white/10 dark:bg-background-dark/50 dark:shadow-[0_18px_50px_rgba(0,0,0,0.20)] dark:group-hover:border-secondary/30 dark:group-hover:shadow-[0_26px_70px_rgba(0,0,0,0.32)]'>
                      <div
                        aria-hidden='true'
                        className={`absolute -right-16 -top-16 h-36 w-36 rounded-full blur-[60px] transition-all duration-500 group-hover:scale-125 ${step.backgroundClass}`}
                      />

                      <div
                        aria-hidden='true'
                        className='absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-secondary/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'
                      />

                      <div className='relative z-10'>
                        <div className='mb-3 flex items-center justify-between gap-3 lg:block'>
                          <h3 className='text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
                            {step.title}
                          </h3>

                          <span
                            className={`font-faNa text-xs font-black lg:mt-3 lg:inline-block ${step.accentClass}`}
                          >
                            مرحله {step.number}
                          </span>
                        </div>

                        <p className='text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
                          {step.description}
                        </p>

                        <div className='mt-5 flex items-center gap-2 text-xs font-bold text-secondary lg:justify-center'>
                          <HiOutlineCheckBadge size={18} />

                          <span>
                            {index === 0 && 'بدون نیاز به تجربه قبلی'}
                            {index === 1 && 'آموزش دقیق و مرحله‌به‌مرحله'}
                            {index === 2 && 'پیشرفت با تمرین مستمر'}
                            {index === 3 && 'تغییری پایدار در زندگی'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{
              opacity: 0,
              y: 25,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.4,
            }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className='relative z-10 mt-10 overflow-hidden rounded-[26px] border border-secondary/15 bg-secondary/5 p-5 sm:mt-14 sm:p-7'
          >
            <div
              aria-hidden='true'
              className='absolute -right-24 -top-24 h-60 w-60 rounded-full bg-secondary/15 blur-[80px]'
            />

            <div
              aria-hidden='true'
              className='bg-yellow/10 absolute -bottom-24 left-[25%] h-56 w-56 rounded-full blur-[80px]'
            />

            <div className='relative flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-right'>
              <div className='max-w-2xl'>
                <div className='mb-2 flex items-center justify-center gap-2 text-secondary lg:justify-start'>
                  <HiOutlineSparkles size={20} />

                  <span className='text-xs font-bold sm:text-sm'>
                    شروع یک مسیر تازه
                  </span>
                </div>

                <h3 className='text-xl font-black leading-9 text-text-light sm:text-2xl dark:text-text-dark'>
                  برای شروع لازم نیست آماده باشی؛ فقط کافی است قدم اول را
                  برداری.
                </h3>

                <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
                  دوره مناسب خودت را انتخاب کن و تمرین را آرام، پیوسته و آگاهانه
                  آغاز کن.
                </p>
              </div>

              <Link
                href='/courses'
                className='group flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-secondary px-7 text-sm font-bold text-white shadow-[0_16px_40px_rgba(38,145,125,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(38,145,125,0.34)] sm:w-auto'
              >
                <HiOutlinePlayCircle size={22} />

                <span>شروع مسیر یادگیری</span>

                <HiOutlineArrowLeft
                  size={19}
                  className='transition-transform duration-300 group-hover:-translate-x-1'
                />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes journeyOrbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes journeyOrbitReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes journeyLine {
          0% {
            transform: translateX(120%);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          85% {
            opacity: 1;
          }

          100% {
            transform: translateX(-360%);
            opacity: 0;
          }
        }

        @keyframes journeyLineMobile {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          85% {
            opacity: 1;
          }

          100% {
            transform: translateY(520%);
            opacity: 0;
          }
        }

        .learning-journey-orbit {
          animation: journeyOrbit 32s linear infinite;
        }

        .learning-journey-orbit-reverse {
          animation: journeyOrbitReverse 28s linear infinite;
        }

        .learning-journey-line {
          animation: journeyLine 6s linear infinite;
        }

        .learning-journey-line-mobile {
          animation: journeyLineMobile 6s linear infinite;
        }

        .learning-journey-grid {
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
            black 82%,
            transparent
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .learning-journey-orbit,
          .learning-journey-orbit-reverse,
          .learning-journey-line,
          .learning-journey-line-mobile {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default LearningJourney;
