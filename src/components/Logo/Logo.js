import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

export default function Logo({ size = 'medium', className }) {
  // Define size classes
  const sizeClasses = {
    small: 'max-h-8 text-lg',
    medium: 'max-h-12 text-2xl',
    large: 'max-h-16 text-3xl',
  };

  return (
    <div className={`flex items-end gap-2 ${sizeClasses[size]} ${className}`}>
      <Image
        src='/images/logo.png'
        alt='samaneh yoga logo'
        width={120}
        height={120}
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
