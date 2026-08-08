import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { getShamsiDate } from '@/utils/dateTimeHelper';

import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

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

const CommentReplyCard = ({ className = '', reply }) => {
  const user = reply?.user ?? {};

  const username = getUserDisplayName(user);

  const avatarSrc = getSafeImageSrc(user?.avatar);

  const replyDate = reply?.createdAt || reply?.createAt;

  return (
    <SiteCard
      as='article'
      variant='secondary'
      padding='sm'
      radius='sm'
      className={`group transition-all duration-300 hover:border-secondary/25 ${className}`}
    >
      <div
        aria-hidden='true'
        className='absolute -left-16 -top-16 h-36 w-36 rounded-full bg-secondary/10 blur-[55px]'
      />

      <div className='relative z-10'>
        <header className='flex items-center gap-3'>
          <Image
            src={avatarSrc}
            alt={`تصویر پروفایل ${username}`}
            width={80}
            height={80}
            className='h-10 w-10 shrink-0 rounded-[14px] border border-secondary/15 object-cover shadow-sm'
          />

          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h4 className='truncate text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                {username}
              </h4>

              <SiteBadge
                icon={HiOutlineChatBubbleLeftRight}
                variant='secondary'
                size='sm'
              >
                پاسخ
              </SiteBadge>
            </div>

            {replyDate && (
              <time
                dateTime={String(replyDate)}
                className='mt-1 block font-faNa text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'
              >
                {getShamsiDate(replyDate)}
              </time>
            )}
          </div>
        </header>

        <p className='mt-4 whitespace-pre-line break-words text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
          {reply?.content || ''}
        </p>
      </div>
    </SiteCard>
  );
};

CommentReplyCard.propTypes = {
  className: PropTypes.string,

  reply: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    content: PropTypes.string,

    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    createAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    user: PropTypes.object,
  }).isRequired,
};

export default CommentReplyCard;
