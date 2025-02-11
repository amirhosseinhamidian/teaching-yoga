'use client';
import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ArticleMiniCard = ({ article, className }) => {
  const router = useRouter();
  const handleClickArticle = () => {
    router.push(`/articles/${article.shortAddress}`);
  };

  return (
    <div className={` ${className}`}>
      <Image
        src={article.cover}
        alt={article.title}
        width={1200}
        height={850}
        className='h-52 rounded-3xl object-cover md:cursor-pointer'
        onClick={handleClickArticle}
      />
      <div className='mx-2 -mt-6 rounded-3xl bg-surface-light p-6 pt-10 xs:mx-4 md:mx-4 lg:mx-6 dark:bg-surface-dark'>
        <h3
          className='min-h-12 font-semibold md:cursor-pointer'
          onClick={handleClickArticle}
        >
          {article.title}
        </h3>
        <div className='mt-4 flex items-center justify-between'>
          <h5 className='font-faNa text-2xs text-accent sm:text-xs'>
            {getShamsiDate(article.updatedAt)}
          </h5>
          <Link
            href={`/articles/${article.shortAddress}`}
            className='text-xs text-accent transition-all duration-200 ease-in hover:scale-110 sm:text-sm'
          >
            خواندن مقاله
          </Link>
        </div>
      </div>
    </div>
  );
};

ArticleMiniCard.propTypes = {
  article: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default ArticleMiniCard;
