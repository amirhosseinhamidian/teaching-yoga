import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const sizeClasses = {
  sm: 'h-3.5 w-3.5 border-[1.5px]',
  md: 'h-4 w-4 border-2',
  lg: 'h-5 w-5 border-2',
};

const LoadingSpinner = ({ size = 'md', light = false, className = '' }) => {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full',
        light
          ? 'border-white/35 border-t-white'
          : 'border-secondary/25 border-t-secondary',
        sizeClasses[size],
        className
      )}
    />
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  light: PropTypes.bool,
  className: PropTypes.string,
};

export default LoadingSpinner;
