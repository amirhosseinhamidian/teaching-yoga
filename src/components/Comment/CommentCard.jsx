import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import CommentReplyCard from './CommentReplyCard';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { getShamsiDate } from '@/utils/dateTimeHelper';

import { PENDING, REJECTED } from '@/constants/commentStatus';

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';

const DEFAULT_AVATAR = '/images/default-profile.png';

const getSafeImageSrc = (src) => {
  if (typeof src !== 'string') {
    return DEFAULT_AVATAR;
  }

  const value = src.trim();

  if (!value || value.startsWith('blob:') || value.startsWith('data:')) {
    return DEFAULT_AVATAR;
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return value;
    }
  } catch {
    return DEFAULT_AVATAR;
  }

  return DEFAULT_AVATAR;
};

const getUserDisplayName = (user) => {
  if (user?.username) {
    return user.username;
  }

  const firstName = user?.firstname || user?.firstName || '';

  const lastName = user?.lastname || user?.lastName || '';

  return `${firstName} ${lastName}`.trim() || 'کاربر';
};

const CommentCard = ({ className = '', comment }) => {
  const user = comment?.user ?? {};

  const username = getUserDisplayName(user);

  const avatarSrc = getSafeImageSrc(user?.avatar);

  const commentDate = comment?.createdAt || comment?.createAt;

  const replies = Array.isArray(comment?.replies) ? comment.replies : [];

  return (
    <SiteCard
      as='article'
      variant='soft'
      padding='md'
      radius='md'
      className={`group transition-all duration-300 hover:border-secondary/20 hover:shadow-[0_18px_50px_rgba(38,145,125,0.07)] ${className}`}
    >
      <div
        aria-hidden='true'
        className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[75px] transition-transform duration-500 group-hover:scale-125'
      />

      <div className='relative z-10'>
        {/* Author */}
        <header className='flex flex-col gap-4 border-b border-black/5 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='relative shrink-0'>
              <div
                aria-hidden='true'
                className='to-yellow/25 absolute -inset-1 rounded-[18px] bg-gradient-to-br from-secondary/35 blur-[2px]'
              />

              <Image
                src={avatarSrc}
                width={96}
                height={96}
                alt={`تصویر پروفایل ${username}`}
                className='relative h-11 w-11 rounded-[16px] border-2 border-surface-light object-cover shadow-sm sm:h-12 sm:w-12 dark:border-surface-dark'
              />
            </div>

            <div className='min-w-0'>
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='truncate text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                  {username}
                </h3>

                {comment?.status === PENDING && (
                  <SiteBadge variant='secondary' size='sm'>
                    در انتظار تأیید
                  </SiteBadge>
                )}

                {comment?.status === REJECTED && (
                  <SiteBadge variant='danger' size='sm'>
                    رد شده
                  </SiteBadge>
                )}
              </div>

              {commentDate && (
                <time
                  dateTime={String(commentDate)}
                  className='mt-1 block font-faNa text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'
                >
                  {getShamsiDate(commentDate)}
                </time>
              )}
            </div>
          </div>

          {replies.length > 0 && (
            <SiteBadge
              icon={HiOutlineChatBubbleLeftRight}
              variant='secondary'
              size='sm'
              className='font-faNa'
            >
              {replies.length.toLocaleString('fa-IR')} پاسخ
            </SiteBadge>
          )}
        </header>

        {/* Content */}
        <div className='py-5'>
          <p className='whitespace-pre-line break-words text-sm leading-8 text-text-light sm:text-base sm:leading-9 dark:text-text-dark'>
            {comment?.content || ''}
          </p>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className='border-r-2 border-secondary/15 pr-3 sm:pr-5'>
            <div className='mb-3 flex items-center gap-2 text-secondary'>
              <HiOutlineCheckBadge size={17} />

              <span className='text-[10px] font-bold sm:text-xs'>پاسخ‌ها</span>
            </div>

            <div className='space-y-3'>
              {replies.map((reply) => (
                <CommentReplyCard key={reply.id} reply={reply} />
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteCard>
  );
};

CommentCard.propTypes = {
  className: PropTypes.string,

  comment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    content: PropTypes.string,

    status: PropTypes.string,

    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    createAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    user: PropTypes.object,

    replies: PropTypes.array,
  }).isRequired,
};

export default CommentCard;
