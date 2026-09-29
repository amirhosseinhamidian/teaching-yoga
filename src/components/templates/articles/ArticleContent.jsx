import React from 'react';
import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import { splitArticleCourseEmbeds } from '@/utils/articleCourseEmbeds';

const getEmbedTitle = (html) =>
  String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

const InlineCourseCard = ({ course, fallbackTitle, slug }) => {
  const title = course?.title || fallbackTitle || 'مشاهده دوره آموزشی';
  const href = `/courses/${encodeURIComponent(slug)}`;

  return (
    <SiteCard
      as='aside'
      variant='secondary'
      padding='none'
      radius='md'
      topLine
      className='group my-8 transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/35 hover:shadow-[0_22px_60px_rgba(38,145,125,0.14)]'
    >
      <div className='grid sm:grid-cols-[210px_minmax(0,1fr)]'>
        <Link
          href={href}
          aria-label={`مشاهده دوره ${title}`}
          className='relative block min-h-[190px] overflow-hidden !no-underline sm:min-h-full'
        >
          {course?.cover ? (
            <Image
              src={course.cover}
              alt={title}
              fill
              sizes='(max-width: 640px) 100vw, 210px'
              className='!m-0 !h-full !w-full !max-w-none !rounded-none object-cover transition-transform duration-700 group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full min-h-[190px] items-center justify-center bg-secondary/10 text-secondary'>
              <HiOutlineBookOpen size={48} />
            </div>
          )}

          <div className='absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent' />

          <span className='absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/30 px-2.5 py-1.5 text-[10px] font-bold !text-white backdrop-blur-md'>
            <HiOutlinePlayCircle size={15} />
            دوره آموزشی
          </span>
        </Link>

        <div className='relative flex min-w-0 flex-col p-5 sm:p-6'>
          <div
            aria-hidden='true'
            className='absolute -left-16 -top-16 h-36 w-36 rounded-full bg-secondary/10 blur-[50px]'
          />

          <div className='relative z-10 flex h-full flex-col'>
            <SiteBadge
              icon={HiOutlineAcademicCap}
              variant='secondary'
              size='sm'
              className='w-fit'
            >
              پیشنهاد مرتبط با مقاله
            </SiteBadge>

            <Link href={href} className='!no-underline'>
              <h3 className='!mb-0 !mt-3 line-clamp-2 !text-lg !font-black !leading-8 !text-text-light transition-colors group-hover:!text-secondary sm:!text-xl dark:!text-text-dark'>
                {title}
              </h3>
            </Link>

            {course?.subtitle && (
              <p className='!mb-0 !mt-2 line-clamp-2 !text-xs !leading-6 !text-subtext-light sm:!text-sm sm:!leading-7 dark:!text-subtext-dark'>
                {course.subtitle}
              </p>
            )}

            <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-secondary/15 pt-4 sm:mt-auto'>
              <span className='text-[11px] font-bold !text-subtext-light dark:!text-subtext-dark'>
                برای مشاهده سرفصل‌ها و ثبت‌نام
              </span>

              <SiteButton
                href={href}
                variant='primary'
                size='md'
                endIcon={HiOutlineArrowLeft}
                className='!text-white !no-underline'
              >
                مشاهده دوره
              </SiteButton>
            </div>
          </div>
        </div>
      </div>
    </SiteCard>
  );
};

InlineCourseCard.propTypes = {
  course: PropTypes.shape({
    title: PropTypes.string,
    subtitle: PropTypes.string,
    cover: PropTypes.string,
  }),
  fallbackTitle: PropTypes.string,
  slug: PropTypes.string.isRequired,
};

const ArticleContent = ({ content = '', courses = [], className = '' }) => {
  const coursesBySlug = new Map(
    courses.map((course) => [course.shortAddress, course])
  );

  return (
    <div className={className}>
      {splitArticleCourseEmbeds(content).map((part, index) => {
        if (part.type === 'course' && part.slug) {
          return (
            <InlineCourseCard
              key={`course-${part.slug}-${index}`}
              slug={part.slug}
              course={coursesBySlug.get(part.slug)}
              fallbackTitle={getEmbedTitle(part.value)}
            />
          );
        }

        return (
          <div
            key={`html-${index}`}
            className='contents'
            dangerouslySetInnerHTML={{ __html: part.value }}
          />
        );
      })}
    </div>
  );
};

ArticleContent.propTypes = {
  content: PropTypes.string,
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      shortAddress: PropTypes.string.isRequired,
      title: PropTypes.string,
      subtitle: PropTypes.string,
      cover: PropTypes.string,
    })
  ),
  className: PropTypes.string,
};

export default ArticleContent;
