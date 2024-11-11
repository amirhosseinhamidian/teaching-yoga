import React from 'react';
import PropTypes from 'prop-types';
import { formatTime } from '@/utils/dateTimeHelper';
import { FiLock } from 'react-icons/fi';
import { IoPlayOutline } from 'react-icons/io5';

const SessionRow = ({ number, session, className }) => {
  return (
    <div
      className={`group flex items-center justify-between border-b border-gray-200 py-4 md:cursor-pointer dark:border-gray-700 ${className}`}
    >
      <div className='flex items-center gap-3'>
        <div className='flex h-6 w-6 items-center justify-center rounded border border-secondary text-secondary transition-all duration-200 ease-in group-hover:bg-secondary group-hover:text-text-dark md:h-8 md:w-8'>
          <span className='font-faNa text-xs font-bold sm:text-base md:text-lg'>
            {number}
          </span>
        </div>
        <h5 className='text-xs font-medium text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary sm:text-base md:text-lg dark:text-subtext-dark'>
          {session.name}
        </h5>
      </div>
      <div className='flex items-center gap-2 md:gap-6'>
        <span className='font-faNa text-xs text-subtext-light transition-all duration-200 ease-in group-hover:text-secondary sm:text-sm md:text-base dark:text-subtext-dark'>
          {formatTime(session.duration)}
        </span>
        {session.isFree ? (
          <IoPlayOutline className='mb-1 text-accent md:text-xl' />
        ) : (
          <FiLock className='mb-1 text-red md:text-xl' />
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
