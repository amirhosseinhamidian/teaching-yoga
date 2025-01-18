import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';
import Button from '@/components/Ui/Button/Button';

const NotificationItem = ({ text, count, path }) => {
  return (
    <div className='flex-warp mb-4 flex items-center justify-between gap-3 border-b border-gray-300 px-3 py-3 sm:px-5 dark:border-gray-600'>
      <p className='font-faNa text-2xs font-medium text-subtext-light xs:text-xs md:text-sm dark:text-subtext-dark'>
        <span className='font-bold'>{count}</span> {text}
      </p>
      <Link href={path}>
        <Button className='text-2xs sm:text-xs' color='subtext'>
          مشاهده
        </Button>
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
