import React from 'react';
import PropTypes from 'prop-types';
import { IoIosNotifications } from 'react-icons/io';
import Link from 'next/link';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

const NotificationItem = ({ text, count, path }) => {
  return (
    <div className='flex-warp mb-4 flex items-center justify-between gap-3 rounded-xl border border-subtext-light px-3 py-3 sm:px-5 dark:border-subtext-dark'>
      <div className='flex items-center gap-2'>
        <IoIosNotifications className='h-5 w-5 animate-ping-slow text-red sm:h-6 sm:w-6 lg:h-7 lg:w-7' />
        <span className='font-faNa text-2xl font-bold text-subtext-light sm:text-3xl dark:text-subtext-dark'>
          {count}
        </span>
        <p className='font-faNa text-xs font-medium text-subtext-light xs:text-sm md:text-base dark:text-subtext-dark'>
          {text}
        </p>
      </div>
      <Link href={path}>
        <OutlineButton
          className='text-xs sm:text-sm md:text-base'
          color='subtext'
        >
          مشاهده
        </OutlineButton>
      </Link>
    </div>
  );
};

NotificationItem.propTypes = {
  text: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
};

export default NotificationItem;
