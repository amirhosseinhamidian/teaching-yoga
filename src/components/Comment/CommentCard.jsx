import React from 'react';
import PropTypes from 'prop-types';
import CommentReplyCard from './CommentReplyCard';
import { getShamsiDate } from '@/utils/dateTimeHelper';

const CommentCard = ({ className, comment }) => {
  return (
    <div
      className={`rounded-xl bg-background-light p-2 sm:p-6 dark:bg-background-dark ${className}`}
    >
      <div className='border-b border-gray-200 pb-3 sm:pb-6 dark:border-gray-700'>
        <div className='mr-3 flex items-center gap-3'>
          <img
            src={comment.user.avatar}
            alt='user profile picture'
            className='h-10 w-10 rounded-full object-cover sm:h-16 sm:w-16'
          />
          <div className='flex flex-col gap-0 sm:gap-1'>
            <h5 className='text-sm font-medium sm:text-lg'>
              {comment.user.username}
            </h5>
            <span className='font-faNa text-xs font-thin text-subtext-light sm:text-base dark:text-subtext-dark'>
              {getShamsiDate(comment.createAt)}
            </span>
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
