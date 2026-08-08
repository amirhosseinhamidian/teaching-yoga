'use client';

/* eslint-disable no-undef */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import ArticleMiniCard from './ArticleMiniCard';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const fetchArticlesData = async () => {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    const response = await fetch(`${API_URL}/api/articles?lastThree=true`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }

    const result = await response.json();

    return Array.isArray(result?.data) ? result.data : [];
  } catch (error) {
    console.error('[HOME_ARTICLES_FETCH_ERROR]', error);

    return [];
  }
};

const ArticlesSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadArticles = async () => {
      try {
        const data = await fetchArticlesData();

        if (mounted) {
          setArticles(data);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadArticles();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !articles.length) {
    return null;
  }

  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light py-6 transition-colors duration-300 sm:py-10 lg:py-14 dark:bg-background-dark'
    >
      {/* Background */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-52 top-10 h-[500px] w-[500px] rounded-full bg-secondary/10 blur-[150px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-52 bottom-0 h-[470px] w-[470px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

        <div className='articles-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />

        <div className='articles-orbit absolute -right-28 bottom-16 h-72 w-72 rounded-full border border-dashed border-secondary/15' />

        <div className='articles-orbit-reverse border-yellow/15 absolute -left-24 top-24 h-64 w-64 rounded-full border border-dashed' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='relative overflow-hidden rounded-[32px] border border-black/5 bg-surface-light/70 px-4 py-10 shadow-[0_28px_90px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[40px] sm:px-8 sm:py-14 lg:px-10 lg:py-16 dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_30px_100px_rgba(0,0,0,0.25)]'>
          <div className='absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent' />

          <div className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]' />

          <div className='bg-yellow/10 absolute -bottom-32 left-[20%] h-72 w-72 rounded-full blur-[110px]' />

          {/* Header */}
          <div className='relative z-10 mb-12 flex flex-col items-center justify-between gap-8 text-center lg:mb-16 lg:flex-row lg:text-right'>
            <div className='max-w-3xl'>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
                <HiOutlineSparkles size={18} />

                <span>مجله سامانه یوگا</span>
              </div>

              <h2 className='text-3xl font-black leading-[1.7] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
                قدم‌های کوچک برای یک
                <span className='relative mx-2 inline-block text-secondary'>
                  زندگی آگاهانه‌تر
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 300 24'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-4 w-full'
                  >
                    <path
                      d='M6 15C62 4 116 19 172 10C217 3 258 7 294 12'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='5'
                      strokeLinecap='round'
                      opacity='0.8'
                    />

                    <path
                      d='M28 20C88 14 145 20 215 14'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      opacity='0.35'
                    />
                  </svg>
                </span>
              </h2>

              <p className='mt-6 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 dark:text-subtext-dark'>
                مجموعه‌ای از مقاله‌ها و آموزش‌های رایگان درباره یوگا، مدیتیشن،
                تنفس، آرامش ذهن و سلامت بدن.
              </p>
            </div>

            <Link
              href='/articles'
              className='group hidden h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-secondary/20 bg-secondary/10 px-6 text-sm font-bold text-secondary transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-secondary hover:text-white lg:flex'
            >
              <HiOutlineBookOpen size={21} />

              <span>مشاهده همه مقالات</span>

              <HiOutlineArrowLeft
                size={19}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>

          {/* Cards */}

          <div className='relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7'>
            {articles.map((article, index) => (
              <ArticleMiniCard
                key={article.id}
                article={article}
                index={index}
              />
            ))}
          </div>

          {/* Mobile Button */}

          <div className='relative z-10 mt-10 flex justify-center lg:hidden'>
            <Link
              href='/articles'
              className='group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 text-sm font-bold text-white shadow-[0_16px_40px_rgba(38,145,125,0.22)] transition-all duration-300 hover:-translate-y-1 sm:w-auto'
            >
              <HiOutlineBookOpen size={21} />

              <span>مشاهده همه مقالات</span>

              <HiOutlineArrowLeft
                size={19}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes articlesOrbit {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes articlesOrbitReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        .articles-orbit {
          animation: articlesOrbit 34s linear infinite;
        }

        .articles-orbit-reverse {
          animation: articlesOrbitReverse 29s linear infinite;
        }

        .articles-grid {
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
          .articles-orbit,
          .articles-orbit-reverse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default ArticlesSection;
