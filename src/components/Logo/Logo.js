import React from 'react';
import PropTypes from 'prop-types';

export default function Logo({ size = 'medium', className }) {
  // Define size classes
  const sizeClasses = {
    small: 'max-h-8 text-base sm:text-lg',
    medium: 'max-h-12 text-lg sm:text-2xl',
    large: 'max-h-16 text-xl sm:text-3xl',
  };

  return (
    <div className={`flex items-end gap-2 ${sizeClasses[size]} ${className}`}>
      <img
        src='/images/logo.png'
        alt='samaneh yoga logo'
        className={`block ${sizeClasses[size]}`}
      />
      <h2
        className={`font-fancy text-text-light dark:text-text-dark ${sizeClasses[size]}`}
      >
        سمانه یوگا
      </h2>
    </div>
  );
}

// Define PropTypes
Logo.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']), // Size of the logo
  className: PropTypes.string,
};
