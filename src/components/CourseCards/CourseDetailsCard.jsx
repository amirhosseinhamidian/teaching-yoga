/* eslint-disable react/prop-types */

import React from 'react';

const CourseDetailsCard = ({
  icon: Icon,
  title,
  value,
  horizontal,
  className,
}) => {
  return (
    <div
      className={`flex ${horizontal ? 'flex-col gap-1 text-center sm:flex-row sm:gap-3 sm:text-start' : 'flex-col text-center'} items-center rounded-xl bg-surface-light px-2 py-3 shadow sm:px-4 sm:py-2 dark:bg-surface-dark ${className}`}
    >
      <Icon className='text-lg text-accent xs:text-2xl sm:mb-2 sm:text-2xl md:text-3xl lg:text-4xl' />
      <div className={'flex flex-col'}>
        <span className='text-xs font-normal text-subtext-light xs:text-xs md:text-sm dark:text-subtext-dark'>
          {title}
        </span>
        <span className='font-faNa text-2xs font-medium xs:text-xs sm:text-sm md:text-base'>
          {value}
        </span>
      </div>
    </div>
  );
};

export default CourseDetailsCard;
