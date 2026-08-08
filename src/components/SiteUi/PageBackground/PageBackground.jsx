import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const PageBackground = ({
  showGrid = true,
  showOrbits = true,
  className = '',
}) => {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        className
      )}
    >
      <div className='absolute -right-48 top-10 h-[480px] w-[480px] rounded-full bg-secondary/10 blur-[150px] sm:-right-56 sm:h-[580px] sm:w-[580px]' />

      <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-48 bottom-0 h-[440px] w-[440px] rounded-full blur-[150px] sm:-left-56 sm:h-[520px] sm:w-[520px]' />

      <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

      {showGrid && (
        <div className='site-background-grid absolute inset-0 opacity-[0.025] dark:opacity-[0.045]' />
      )}

      {showOrbits && (
        <>
          <div className='site-orbit absolute -right-32 top-[430px] hidden h-80 w-80 rounded-full border border-dashed border-secondary/15 lg:block' />

          <div className='site-orbit-reverse border-yellow/15 absolute -left-28 top-28 hidden h-72 w-72 rounded-full border border-dashed lg:block' />
        </>
      )}
    </div>
  );
};

PageBackground.propTypes = {
  showGrid: PropTypes.bool,
  showOrbits: PropTypes.bool,
  className: PropTypes.string,
};

export default PageBackground;
