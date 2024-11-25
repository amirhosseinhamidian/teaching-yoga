import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({ progress, className }) => {
  return (
    <div className={`flex w-full items-center px-2 ${className}`}>
      <span className='ml-3 font-faNa text-lg font-bold text-primary'>
        {progress}%
      </span>
      <div className='relative h-4 w-full overflow-hidden rounded-full border border-primary bg-background-light dark:bg-background-dark'>
        <div
          className='absolute left-0 h-full rounded-full bg-primary transition-all duration-300 ease-out'
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  progress: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default ProgressBar;
