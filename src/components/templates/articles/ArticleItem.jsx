'use client';
import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import { MdOutlineCalendarToday } from 'react-icons/md';
import Link from 'next/link';

const ArticleItem = ({ article, className }) => {
  return (
    <Link href={`/articles/${article.shortAddress}`} className={className}>
      <div
        className={`flex h-full w-full flex-col rounded-xl bg-surface-light shadow-md transition-all duration-200 ease-in hover:scale-105 md:cursor-pointer dark:bg-surface-dark`}
      >
        <Image
          src={article.cover}
          alt={article.title}
          className='w-full rounded-t-xl object-cover xs:h-40 xl:h-48'
          width={600}
          height={540}
        />
        <div className='flex h-full flex-col justify-between p-4'>
          <div>
            <h2 className='mb-2 text-base font-semibold text-text-light md:text-lg dark:text-text-dark'>
              {article.title}
            </h2>
            <p className='text-2xs text-subtext-light sm:text-xs lg:text-sm dark:text-subtext-dark'>
              {article.subtitle}
            </p>
          </div>
          <div className='mt-2 flex items-center gap-2'>
            <MdOutlineCalendarToday className='text-accent' />
            <h5 className='font-faNa text-2xs text-accent sm:text-xs'>
              {getShamsiDate(article.updatedAt)}
            </h5>
          </div>
        </div>
      </div>
    </Link>
  );
};

ArticleItem.propTypes = {
  article: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default ArticleItem;
