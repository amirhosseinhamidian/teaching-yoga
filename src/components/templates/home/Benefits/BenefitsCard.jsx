'use client';

import React from 'react';
import PropTypes from 'prop-types';

const BenefitsCard = ({ benefit, className }) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(30,191,110,0.15)] dark:border-white/10 dark:bg-surface-dark/70 ${className} `}
    >
      {/* glow */}
      <div className='absolute -right-10 -top-10 h-32 w-32 rounded-full bg-secondary/20 blur-3xl transition-all duration-500 group-hover:bg-secondary/40' />

      <div className='relative flex flex-col items-center text-center'>
        <div className='mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/10 transition-all duration-500 group-hover:scale-110 group-hover:bg-secondary'>
          {benefit.icon}
        </div>

        <h3 className='mb-3 text-xl font-black text-text-light dark:text-text-dark'>
          {benefit.title}
        </h3>

        <p className='text-sm leading-8 text-gray-500 dark:text-gray-400'>
          {benefit.description}
        </p>
      </div>
    </div>
  );
};

BenefitsCard.propTypes = {
  benefit: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default BenefitsCard;
