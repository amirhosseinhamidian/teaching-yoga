import React from 'react';
import PropTypes from 'prop-types';

import Image from 'next/image';
import Link from 'next/link';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
} from 'react-icons/hi2';

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
    <Link
      href={href}
      className='group my-7 grid overflow-hidden rounded-[22px] border border-secondary/20 bg-background-light/75 !text-text-light !no-underline shadow-[0_16px_45px_rgba(38,145,125,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/35 hover:shadow-[0_20px_55px_rgba(38,145,125,0.16)] sm:grid-cols-[180px_minmax(0,1fr)] dark:bg-background-dark/55 dark:!text-text-dark'
    >
      <div className='relative min-h-[170px] overflow-hidden bg-secondary/10 sm:min-h-[150px]'>
        {course?.cover ? (
          <Image
            src={course.cover}
            alt={title}
            fill
            sizes='(max-width: 640px) 100vw, 180px'
            className='!m-0 !h-full !w-full !max-w-none !rounded-none object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full min-h-[170px] items-center justify-center text-secondary sm:min-h-[150px]'>
            <HiOutlineBookOpen size={44} />
          </div>
        )}

        <div className='absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent' />
      </div>

      <div className='relative flex min-w-0 flex-col justify-center p-5 sm:p-6'>
        <div
          aria-hidden='true'
          className='absolute -left-14 -top-14 h-32 w-32 rounded-full bg-secondary/10 blur-[45px]'
        />

        <div className='relative z-10'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1.5 text-[10px] font-black !text-secondary sm:text-xs'>
            <HiOutlineAcademicCap size={14} />
            دوره مرتبط با این مقاله
          </span>

          <h3 className='!mb-0 !mt-3 line-clamp-2 !text-base !font-black !leading-8 !text-text-light sm:!text-lg dark:!text-text-dark'>
            {title}
          </h3>

          {course?.subtitle && (
            <p className='!mb-0 !mt-1.5 line-clamp-2 !text-xs !leading-6 !text-subtext-light sm:!text-sm dark:!text-subtext-dark'>
              {course.subtitle}
            </p>
          )}

          <span className='mt-4 inline-flex items-center gap-2 text-xs font-black !text-secondary'>
            ورود به جزئیات دوره
            <HiOutlineArrowLeft
              size={16}
              className='transition-transform duration-300 group-hover:-translate-x-1'
            />
          </span>
        </div>
      </div>
    </Link>
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
