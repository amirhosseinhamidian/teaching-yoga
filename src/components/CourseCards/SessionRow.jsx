import React from 'react';
import PropTypes from 'prop-types';
import { formatTime } from '@/utils/dateTimeHelper';
import { FiLock } from 'react-icons/fi';
import { IoPlayOutline } from 'react-icons/io5';

const SessionRow = ({ number, session, className }) => {
  console.log('here :  ', session);
  return (
    <div
      className={`group flex items-center justify-between border-t border-gray-200  dark:border-gray-700 p-4 md:cursor-pointer ${className}`}
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-8 w-8 items-center justify-center rounded border border-secondary text-secondary transition-all duration-200 ease-in group-hover:bg-secondary group-hover:text-text-light'>
          <span className='font-faNa text-lg font-bold'>{number}</span>
        </div>
        <h5 className='text-lg font-medium text-subtext-light dark:text-subtext-dark'>
          {session.name}
        </h5>
      </div>
      <div className='flex items-center gap-6'>
        <span className='font-faNa'>زمان: {formatTime(session.duration)}</span>
        {session.isFree ? (
          <IoPlayOutline className='text-xl text-accent' />
        ) : (
          <FiLock className='text-xl text-red' />
        )}
      </div>
    </div>
  );
};

SessionRow.propTypes = {
  number: PropTypes.number.isRequired,
  session: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default SessionRow;
