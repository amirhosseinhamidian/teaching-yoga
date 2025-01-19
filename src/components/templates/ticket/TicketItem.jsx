import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';

const TicketItem = ({ user, date, content, divider = true, className }) => {
  return (
    <div className={className}>
      <div className='flex flex-col gap-2 py-6 md:flex-row md:gap-10'>
        <div className='md:basis-1/5'>
          <Image
            src={user?.avatar ? user.avatar : '/images/default-profile.png'}
            alt={user.username}
            className='h-10 w-10 rounded-full object-cover xs:h-12 xs:w-12 md:h-14 md:w-14 xl:h-16 xl:w-16'
            width={96}
            height={96}
          />
          {user.firstname && user.lastname ? (
            <p className='mt-2 text-xs sm:text-sm'>
              {user.firstname} {user.lastname}
            </p>
          ) : (
            <p className='mt-2 text-xs sm:text-sm'>{user.username}</p>
          )}
          <p className='mt-2 font-faNa text-xs text-subtext-light sm:text-sm dark:text-subtext-dark'>
            {getShamsiDate(date)} {`(${getTimeFromDate(date)})`}
          </p>
        </div>
        <div className='text-xs sm:mt-4 sm:text-sm md:basis-4/5'>{content}</div>
      </div>
      {divider && (
        <div className='mt-6 border-b border-gray-300 dark:border-gray-600'></div>
      )}
    </div>
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
