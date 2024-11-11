import React from 'react';
import PropTypes from 'prop-types';
import { getShamsiDate } from '@/utils/dateTimeHelper';

const CommentReplyCard = ({ className, reply }) => {
  return (
    <div
      className={`rounded-xl bg-foreground-light p-2 sm:p-4 dark:bg-foreground-dark ${className}`}
    >
      <div className='border-b border-gray-300 pb-3 sm:pb-4 dark:border-gray-600'>
        <div className='mr-3 flex items-center gap-1'>
          <img
            src={reply.user.avatar}
            alt='user profile picture'
            className='h-8 w-8 rounded-full object-cover sm:h-12 sm:w-12'
          />
          <div className='flex flex-col gap-0 sm:gap-1'>
            <h5 className='text-sm font-medium sm:text-base'>
              {reply.user.username}
            </h5>
            <span className='font-faNa text-xs font-thin text-subtext-light sm:text-sm dark:text-subtext-dark'>
              {getShamsiDate(reply.createAt)}
            </span>
          </div>
        </div>
      </div>
      <p className='m-2 text-xs font-light sm:m-4 sm:text-base'>
        {reply.content}
      </p>
    </div>
  );
};

CommentReplyCard.propTypes = {
  className: PropTypes.string,
  reply: PropTypes.object.isRequired,
};

export default CommentReplyCard;
