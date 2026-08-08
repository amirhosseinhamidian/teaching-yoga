import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const SiteProgressBar = ({ progress, showValue = true, className = '' }) => {
  const numericProgress = Number(progress);

  const safeProgress = Number.isFinite(numericProgress)
    ? Math.min(Math.max(numericProgress, 0), 100)
    : 0;

  return (
    <div className={cn('w-full', className)}>
      <div className='h-2.5 w-full overflow-hidden rounded-full bg-secondary/10 dark:bg-white/[0.07]'>
        <div
          className='h-full rounded-full bg-secondary transition-[width] duration-500 ease-out'
          style={{
            width: `${safeProgress}%`,
          }}
        />
      </div>

      {showValue && (
        <div className='mt-2 flex items-center justify-between font-faNa text-[10px] text-subtext-light dark:text-subtext-dark'>
          <span>{safeProgress.toLocaleString('fa-IR')}٪</span>

          <span>۱۰۰٪</span>
        </div>
      )}
    </div>
  );
};

SiteProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  showValue: PropTypes.bool,
  className: PropTypes.string,
};

export default SiteProgressBar;
