import React from 'react';
import PropTypes from 'prop-types';

import SiteCard from '@/components/SiteUi/Card/SiteCard';

const CourseDetailsCard = ({ icon: Icon, title, value, className = '' }) => {
  const displayedValue =
    value === null || value === undefined || value === '' ? '—' : value;

  return (
    <SiteCard
      variant='soft'
      padding='sm'
      radius='sm'
      className={`group min-w-0 text-center ${className}`}
    >
      <span className='mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-white'>
        <Icon className='text-[19px]' aria-hidden='true' />
      </span>

      <span className='mt-2 block text-[9px] leading-5 text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
        {title}
      </span>

      <span className='mt-0.5 block truncate font-faNa text-[11px] font-black leading-6 text-text-light sm:text-xs dark:text-text-dark'>
        {displayedValue}
      </span>
    </SiteCard>
  );
};

CourseDetailsCard.propTypes = {
  icon: PropTypes.elementType.isRequired,

  title: PropTypes.string.isRequired,

  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  className: PropTypes.string,
};

export default CourseDetailsCard;
