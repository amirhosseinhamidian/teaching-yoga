import React from 'react';
import PropTypes from 'prop-types';
import CommentReplyCard from './CommentReplyCard';

const CommentCard = ({ className }) => {
  return (
    <div
      className={`rounded-xl bg-background-light p-2 sm:p-6 dark:bg-background-dark ${className}`}
    >
      <div className='border-b border-gray-200 pb-3 sm:pb-6 dark:border-gray-700'>
        <div className='mr-3 flex items-center gap-3'>
          <img
            src='/images/c1.jpg'
            alt='user profile picture'
            className='h-10 w-10 rounded-full object-cover sm:h-16 sm:w-16'
          />
          <div className='flex flex-col gap-0 sm:gap-1'>
            <h5 className='text-sm font-medium sm:text-lg'>Ahmad</h5>
            <span className='font-faNa text-xs font-thin text-subtext-light sm:text-base dark:text-subtext-dark'>
              1403/05/06
            </span>
          </div>
        </div>
      </div>
      <p className='m-2 text-xs font-light sm:m-4 sm:text-base'>
        دوره آفلاین یوگا جامع واقعا فراتر از انتظاراتم بود! تمام تمرین‌ها
        به‌خوبی توضیح داده شده و ویدیوها کیفیت بالایی دارند. من توانستم به راحتی
        در خانه تمرین کنم و احساس آرامش و انرژی فوق‌العاده‌ای پیدا کردم. به همه
        دوستانم توصیه می‌کنم که این دوره را امتحان کنند!
      </p>
      <CommentReplyCard className='mt-4' />
    </div>
  );
};

CommentCard.propTypes = {
  className: PropTypes.string,
};

export default CommentCard;
