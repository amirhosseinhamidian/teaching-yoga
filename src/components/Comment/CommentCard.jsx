import React from 'react';
import PropTypes from 'prop-types';
import CommentReplyCard from './CommentReplyCard';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import { PENDING, REJECTED } from '@/constants/commentStatus';
import Image from 'next/image';

const CommentCard = ({ className, comment }) => {
  return (
    <div
      className={`rounded-xl bg-background-light p-2 sm:p-4 dark:bg-background-dark ${className}`}
    >
      <div className='border-b border-gray-300 pb-2 sm:pb-4 dark:border-gray-600'>
        <div className='mr-3 flex items-center gap-1'>
          <Image
            src={comment.user.avatar}
            width={240}
            height={240}
            alt='user profile picture'
            className='h-8 w-8 rounded-full object-cover sm:h-12 sm:w-12'
          />
          <div className='flex flex-col gap-0 sm:gap-1'>
            <h5 className='text-sm font-medium sm:text-base'>
              {comment.user.username}
            </h5>
            <span className='font-faNa text-xs font-thin text-subtext-light sm:text-sm dark:text-subtext-dark'>
              {getShamsiDate(comment.createAt)}
            </span>
            {comment.status == PENDING && (
              <span className='rounded-2xl border border-blue border-opacity-40 bg-blue bg-opacity-20 px-2 text-center text-2xs text-blue sm:text-xs'>
                در انتظار تایید
              </span>
            )}
            {comment.status == REJECTED && (
              <span className='rounded-2xl border border-red border-opacity-40 bg-red bg-opacity-20 px-2 text-center text-2xs text-red sm:text-xs'>
                رد شده
              </span>
            )}
          </div>
        </div>
      </div>
      <p className='m-2 text-xs font-light sm:m-4 sm:text-base'>
        {comment.content}
      </p>
      {comment.replies &&
        comment.replies.map((reply) => (
          <CommentReplyCard key={reply.id} className='mt-4' reply={reply} />
        ))}
    </div>
  );
};

CommentCard.propTypes = {
  className: PropTypes.string,
  comment: PropTypes.object.isRequired,
};

export default CommentCard;
