'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { getShamsiDate } from '@/utils/dateTimeHelper';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

const ArticleMiniCard = ({ article, className = '', index = 0 }) => {
  const articleHref = `/articles/${article.shortAddress}`;

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 35,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.1, 0.3),
        ease: 'easeOut',
      }}
      className={`group relative h-full ${className}`}
    >
      <div className='relative flex h-full flex-col overflow-hidden rounded-[30px] border border-black/5 bg-surface-light/80 shadow-[0_18px_55px_rgba(15,23,42,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-secondary/25 hover:shadow-[0_28px_75px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-surface-dark/75 dark:shadow-[0_20px_60px_rgba(0,0,0,0.24)] dark:hover:border-secondary/30 dark:hover:shadow-[0_30px_80px_rgba(0,0,0,0.34)]'>
        {/* Image */}
        <Link
          href={articleHref}
          aria-label={`مطالعه مقاله ${article.title}`}
          className='relative block h-56 overflow-hidden sm:h-60'
        >
          <Image
            src={article.cover}
            alt={article.title}
            fill
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover transition-transform duration-700 ease-out group-hover:scale-105'
          />

          <div className='absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent' />

          <div className='absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5'>
            <div className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-2 text-xs font-bold text-white backdrop-blur-md'>
              <HiOutlineBookOpen size={17} />

              <span>مقاله آموزشی</span>
            </div>

            <div className='flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-secondary group-hover:text-white'>
              <HiOutlineArrowLeft
                size={20}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className='relative flex flex-1 flex-col p-5 sm:p-6'>
          <div
            aria-hidden='true'
            className='absolute -right-20 -top-16 h-36 w-36 rounded-full bg-secondary/10 blur-[55px] transition-transform duration-500 group-hover:scale-125'
          />

          <div className='relative z-10 flex h-full flex-col'>
            <div className='mb-4 flex items-center gap-2 text-xs text-subtext-light dark:text-subtext-dark'>
              <HiOutlineCalendarDays
                size={18}
                className='shrink-0 text-secondary'
              />

              <time dateTime={article.updatedAt}>
                آخرین به‌روزرسانی:{' '}
                <span className='font-faNa'>
                  {getShamsiDate(article.updatedAt)}
                </span>
              </time>
            </div>

            <Link href={articleHref}>
              <h3 className='line-clamp-2 min-h-[64px] text-lg font-black leading-8 text-text-light transition-colors duration-300 group-hover:text-secondary sm:text-xl dark:text-text-dark'>
                {article.title}
              </h3>
            </Link>

            {article.description && (
              <p className='mt-3 line-clamp-3 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
                {article.description}
              </p>
            )}

            <div className='mt-auto pt-6'>
              <div className='mb-5 h-px w-full bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

              <Link
                href={articleHref}
                className='inline-flex items-center gap-2 text-sm font-bold text-secondary'
              >
                <span>خواندن مقاله</span>

                <HiOutlineArrowLeft
                  size={19}
                  className='transition-transform duration-300 group-hover:-translate-x-1'
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

ArticleMiniCard.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string.isRequired,
    shortAddress: PropTypes.string.isRequired,
    cover: PropTypes.string.isRequired,
    description: PropTypes.string,
    updatedAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]).isRequired,
  }).isRequired,
  className: PropTypes.string,
  index: PropTypes.number,
};

export default ArticleMiniCard;
