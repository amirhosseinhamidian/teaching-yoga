'use client';

import React, { useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';

import { HiOutlineCalendarDays, HiOutlinePhoto } from 'react-icons/hi2';

import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';

const TicketItem = ({ user, date, content, divider = true, className }) => {
  const [imageError, setImageError] = useState(false);

  const displayName =
    user?.firstname && user?.lastname
      ? `${user.firstname} ${user.lastname}`
      : user?.username || 'کاربر';

  return (
    <article className={`relative ${className || ''}`}>
      <div className='rounded-[22px] border border-black/5 bg-background-light/45 p-4 transition-colors sm:p-5 dark:border-white/10 dark:bg-background-dark/25'>
        <div className='flex items-start gap-3 sm:gap-4'>
          {/* Avatar */}
          <div className='relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-surface-light sm:h-12 sm:w-12 dark:border-white/10 dark:bg-surface-dark'>
            {user?.avatar && !imageError ? (
              <Image
                src={user.avatar}
                alt={displayName}
                fill
                sizes='48px'
                className='object-cover'
                onError={() => setImageError(true)}
              />
            ) : (
              <HiOutlinePhoto size={19} className='text-secondary/40' />
            )}
          </div>

          <div className='min-w-0 flex-1'>
            {/* Meta */}
            <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
              <h3 className='truncate text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                {displayName}
              </h3>

              <div className='flex items-center gap-1.5 font-faNa text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                <HiOutlineCalendarDays size={13} />
                <span>{getShamsiDate(date)}</span>s
                <span className='opacity-40'>•</span>
                <span>{getTimeFromDate(date)}</span>
              </div>
            </div>

            {/* Content */}
            <div
              className='mt-3 break-words text-xs leading-7 text-text-light sm:text-sm sm:leading-8 dark:text-text-dark [&_a]:text-secondary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-r-2 [&_blockquote]:border-secondary/30 [&_blockquote]:pr-3 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pr-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pr-5'
              dangerouslySetInnerHTML={{
                __html: content,
              }}
            />
          </div>
        </div>
      </div>

      {divider && (
        <div className='mx-auto my-3 h-px w-[94%] bg-black/[0.04] dark:bg-white/[0.06]' />
      )}
    </article>
  );
};

TicketItem.propTypes = {
  user: PropTypes.object.isRequired,

  date: PropTypes.string.isRequired,

  content: PropTypes.string.isRequired,

  divider: PropTypes.bool,

  className: PropTypes.string,
};

export default TicketItem;
