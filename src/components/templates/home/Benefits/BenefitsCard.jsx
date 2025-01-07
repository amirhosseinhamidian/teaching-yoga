'use client';
import React from 'react';
import PropTypes from 'prop-types';

const BenefitsCard = ({ benefit, className }) => {
  return (
    <div
      className={`group flex flex-col items-center gap-4 rounded-xl bg-surface-light p-4 transition-all duration-300 ease-in hover:bg-accent hover:text-text-light sm:p-5 md:p-6 lg:p-8 dark:bg-surface-dark ${className}`}
    >
      <div className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-background-light p-4 transition-all duration-300 ease-in group-hover:scale-110 group-hover:border-none group-hover:bg-gradient-to-tr group-hover:from-[#1EBF6E] group-hover:to-[#64F4AB] xs:h-20 xs:w-20 sm:h-16 sm:w-16 md:h-20 md:w-20 md:p-0 lg:h-24 lg:w-24 dark:bg-background-dark'>
        {benefit.icon}
      </div>
      <h3 className='text-base font-bold sm:text-lg md:text-xl lg:text-2xl'>
        {benefit.title}
      </h3>
      <p className='my-3 text-center text-xs xs:text-sm lg:text-base'>
        {benefit.description}
      </p>
    </div>
  );
};

BenefitsCard.propTypes = {
  benefit: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default BenefitsCard;
