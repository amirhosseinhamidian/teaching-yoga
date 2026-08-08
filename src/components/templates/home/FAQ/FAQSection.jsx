'use client';

/* eslint-disable no-undef */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import FAQItem from './FAQItem';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { MdSelfImprovement } from 'react-icons/md';

const fetchFAQs = async (signal) => {
  const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const response = await fetch(`${API_URL}/api/faqs?category=GENERAL`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  const result = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(result?.error || 'دریافت سؤالات متداول انجام نشد');
  }

  return Array.isArray(result) ? result : [];
};

const FAQSkeleton = () => {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className='h-[82px] animate-pulse rounded-[22px] border border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]'
        />
      ))}
    </div>
  );
};

const FAQSection = () => {
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadFAQs = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const data = await fetchFAQs(controller.signal);

        setFaqs(data);

        if (data.length > 0) {
          setOpenId(data[0].id);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[HOME_FAQS_FETCH_ERROR]', error);
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadFAQs();

    return () => {
      controller.abort();
    };
  }, []);

  const handleToggle = (faqId) => {
    setOpenId((currentId) => (currentId === faqId ? null : faqId));
  };

  if (!isLoading && (hasError || faqs.length === 0)) {
    return null;
  }

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
        <div className='absolute -right-52 top-20 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[150px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-52 bottom-0 h-[480px] w-[480px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

        <div className='faq-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />

        <div className='faq-orbit absolute -right-32 bottom-20 h-72 w-72 rounded-full border border-dashed border-secondary/15' />

        <div className='faq-orbit-reverse border-yellow/15 absolute -left-28 top-24 h-64 w-64 rounded-full border border-dashed' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='relative overflow-hidden rounded-[32px] border border-black/5 bg-surface-light/70 px-4 py-10 shadow-[0_28px_90px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[40px] sm:px-8 sm:py-14 lg:px-10 lg:py-16 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_30px_100px_rgba(0,0,0,0.25)]'>
          <div
            aria-hidden='true'
            className='absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent'
          />

          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/10 absolute -bottom-32 left-[20%] h-72 w-72 rounded-full blur-[110px]'
          />

          {/* Header */}
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
            className='relative z-10 mx-auto mb-12 max-w-3xl text-center lg:mb-16'
          >
            <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
              <HiOutlineSparkles size={18} />

              <span>سؤالات متداول</span>
            </div>

            <h2 className='text-3xl font-black leading-[1.7] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
              پاسخ به سؤالات شما قبل از
              <span className='relative mx-2 inline-block text-secondary'>
                شروع مسیر
                <svg
                  aria-hidden='true'
                  viewBox='0 0 220 24'
                  preserveAspectRatio='none'
                  className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                >
                  <path
                    d='M5 15C48 4 89 19 132 10C165 4 194 7 215 12'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='5'
                    strokeLinecap='round'
                    opacity='0.8'
                  />

                  <path
                    d='M24 20C69 14 113 20 169 14'
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
              اگر درباره شروع تمرین، انتخاب دوره یا نحوه استفاده از آموزش‌ها
              سؤالی داری، پاسخ آن را در این بخش پیدا کن.
            </p>
          </motion.div>

          <div className='relative z-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10'>
            {/* Accordion */}
            <div>
              {isLoading ? (
                <FAQSkeleton />
              ) : (
                <div className='space-y-4'>
                  {faqs.map((faq, index) => (
                    <FAQItem
                      key={faq.id}
                      faq={faq}
                      index={index}
                      isOpen={openId === faq.id}
                      onToggle={() => handleToggle(faq.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Side visual */}
            <motion.aside
              initial={{
                opacity: 0,
                x: -30,
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
                ease: 'easeOut',
              }}
              className='relative overflow-hidden rounded-[28px] border border-secondary/15 bg-secondary/5 p-6 text-center shadow-[0_20px_60px_rgba(38,145,125,0.08)] sm:p-8 lg:sticky lg:top-32 dark:bg-secondary/10'
            >
              <div
                aria-hidden='true'
                className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/20 blur-[70px]'
              />

              <div
                aria-hidden='true'
                className='bg-yellow/15 absolute -bottom-20 -left-20 h-52 w-52 rounded-full blur-[70px]'
              />

              <div className='relative mx-auto mb-7 flex h-48 w-48 items-center justify-center sm:h-56 sm:w-56'>
                <div className='faq-visual-orbit absolute inset-0 rounded-full border border-dashed border-secondary/25' />

                <div className='faq-visual-orbit-reverse border-yellow/25 absolute inset-5 rounded-full border border-dashed' />

                <div className='to-yellow/15 absolute inset-10 rounded-full bg-gradient-to-br from-secondary/20 via-secondary/5 blur-sm' />

                <div className='relative flex h-28 w-28 items-center justify-center rounded-[38px] border border-white/30 bg-surface-light/70 text-secondary shadow-[0_20px_55px_rgba(38,145,125,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/70'>
                  <MdSelfImprovement size={62} />
                </div>

                <span className='faq-float absolute right-2 top-8 flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary/20 bg-surface-light/80 text-secondary shadow-md backdrop-blur-md dark:bg-surface-dark/80'>
                  <HiOutlineSparkles size={20} />
                </span>

                <span className='faq-float-delayed border-yellow/20 text-yellow absolute bottom-8 left-1 flex h-10 w-10 items-center justify-center rounded-2xl border bg-surface-light/80 shadow-md backdrop-blur-md dark:bg-surface-dark/80'>
                  <HiOutlineCheckBadge size={20} />
                </span>
              </div>

              <div className='relative'>
                <h3 className='text-xl font-black leading-9 text-text-light dark:text-text-dark'>
                  پاسخ سؤالت را پیدا نکردی؟
                </h3>

                <p className='mt-3 text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
                  با مشاهده دوره‌ها می‌توانی جزئیات مسیر، سطح آموزش و شرایط هر
                  دوره را بررسی کنی.
                </p>

                <Link
                  href='/courses'
                  className='h-13 group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-4 text-sm font-bold text-white shadow-[0_15px_35px_rgba(38,145,125,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(38,145,125,0.32)]'
                >
                  <HiOutlineBookOpen size={20} />

                  <span>مشاهده دوره‌ها</span>

                  <HiOutlineArrowLeft
                    size={18}
                    className='transition-transform duration-300 group-hover:-translate-x-1'
                  />
                </Link>
              </div>
            </motion.aside>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes faqOrbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes faqOrbitReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes faqFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        .faq-orbit,
        .faq-visual-orbit {
          animation: faqOrbit 34s linear infinite;
        }

        .faq-orbit-reverse,
        .faq-visual-orbit-reverse {
          animation: faqOrbitReverse 28s linear infinite;
        }

        .faq-float {
          animation: faqFloat 4s ease-in-out infinite;
        }

        .faq-float-delayed {
          animation: faqFloat 4s ease-in-out 1.3s infinite;
        }

        .faq-grid {
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
            black 18%,
            black 82%,
            transparent
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .faq-orbit,
          .faq-orbit-reverse,
          .faq-visual-orbit,
          .faq-visual-orbit-reverse,
          .faq-float,
          .faq-float-delayed {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default FAQSection;
