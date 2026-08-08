/* eslint-disable no-undef */
import React from 'react';
import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import {
  HiOutlineArrowUpLeft,
  HiOutlineCalendarDays,
  HiOutlineClock,
} from 'react-icons/hi2';

const formatPersianDate = (dateValue) => {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const ArticleCard = ({ article, priority = false }) => {
  const { title, subtitle, cover, shortAddress, readTime, updatedAt } = article;

  const formattedDate = formatPersianDate(updatedAt);

  const articleHref = `/articles/${encodeURIComponent(shortAddress)}`;

  return (
    <SiteCard
      as='article'
      variant='glass'
      padding='none'
      radius='lg'
      hover
      className='group flex h-full flex-col overflow-hidden'
    >
      {/* Cover */}
      <Link
        href={articleHref}
        className='relative block aspect-[16/10] w-full overflow-hidden bg-secondary/5'
        aria-label={`مشاهده مقاله ${title}`}
      >
        {cover ? (
          <Image
            src={cover}
            alt={title || 'تصویر مقاله'}
            fill
            priority={priority}
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            className='object-cover transition-transform duration-500 group-hover:scale-[1.035]'
          />
        ) : (
          <div className='to-yellow/10 absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/15 via-secondary/5'>
            <span className='text-sm font-black text-secondary/50'>
              سمانه یوگا
            </span>
          </div>
        )}

        <div className='absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent' />

        {/* Reading time */}
        {readTime ? (
          <div className='absolute bottom-3 right-3'>
            <SiteBadge
              variant='neutral'
              size='sm'
              className='border-white/15 bg-black/35 text-white backdrop-blur-md dark:border-white/15 dark:bg-black/35 dark:text-white'
            >
              <span className='flex items-center gap-1.5'>
                <HiOutlineClock size={14} />

                <span className='font-faNa'>{readTime}</span>

                <span>دقیقه مطالعه</span>
              </span>
            </SiteBadge>
          </div>
        ) : null}
      </Link>

      {/* Content */}
      <div className='flex flex-1 flex-col p-4 sm:p-5'>
        {formattedDate && (
          <div className='flex items-center gap-1.5 text-[10px] font-medium text-subtext-light sm:text-xs dark:text-subtext-dark'>
            <HiOutlineCalendarDays
              size={14}
              className='shrink-0 text-secondary'
            />

            <time dateTime={updatedAt}>{formattedDate}</time>
          </div>
        )}

        <Link href={articleHref} className='mt-2 block'>
          <h2 className='line-clamp-2 min-h-[56px] text-base font-black leading-7 text-text-light transition-colors duration-200 group-hover:text-secondary sm:text-lg sm:leading-8 dark:text-text-dark'>
            {title}
          </h2>
        </Link>

        {subtitle && (
          <p className='mt-2 line-clamp-2 min-h-[48px] text-xs leading-6 text-subtext-light sm:text-sm sm:leading-7 dark:text-subtext-dark'>
            {subtitle}
          </p>
        )}

        <div className='mt-auto pt-5'>
          <Link
            href={articleHref}
            className='inline-flex min-h-10 items-center gap-2 text-xs font-black text-secondary transition-all duration-200 hover:gap-3 sm:text-sm'
          >
            <span>خواندن مقاله</span>

            <HiOutlineArrowUpLeft size={17} />
          </Link>
        </div>
      </div>
    </SiteCard>
  );
};

ArticleCard.propTypes = {
  article: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    title: PropTypes.string,
    subtitle: PropTypes.string,
    cover: PropTypes.string,
    shortAddress: PropTypes.string.isRequired,

    readTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    updatedAt: PropTypes.string,
  }).isRequired,

  priority: PropTypes.bool,
};

export default ArticleCard;
