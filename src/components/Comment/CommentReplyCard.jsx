import React from 'react';
import PropTypes from 'prop-types';

const CommentReplyCard = ({ className }) => {
  return (
    <div
      className={`rounded-xl bg-surface-light p-2 sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <div className='border-b border-gray-200 pb-3 sm:pb-6 dark:border-gray-700'>
        <div className='mr-3 flex items-center gap-3'>
          <img
            src='/images/c1.jpg'
            alt='user profile picture'
            className='h-10 w-10 rounded-full object-cover sm:h-16 sm:w-16'
          />
          <div className='flex flex-col gap-0 sm:gap-1'>
            <h5 className='text-sm font-medium sm:text-lg'>سمانه| مدرس</h5>
            <span className='font-faNa text-xs font-thin text-subtext-light sm:text-base dark:text-subtext-dark'>
              1403/05/06
            </span>
          </div>
        </div>
      </div>
      <p className='m-2 text-xs font-light sm:m-4 sm:text-base'>
        سلام! بسیار خوشحالیم که از دوره آفلاین یوگا جامع راضی هستید و
        توانسته‌اید از آن بهره‌مند شوید. هدف ما ارائه محتوای باکیفیت و تجربه‌ای
        مفید برای کاربران است. اگر سوال یا پیشنهادی دارید، لطفا در تماس باشید.
        ممنون از شما که تجربه‌تان را با ما به اشتراک گذاشتید!
      </p>
    </div>
  );
};

CommentReplyCard.propTypes = {
  className: PropTypes.string,
};

export default CommentReplyCard;
