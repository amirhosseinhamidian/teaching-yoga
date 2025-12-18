'use client';

import React from 'react';
import PropTypes from 'prop-types';

export default function Price({ finalPrice, discount, price, className }) {
  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span
        className={`font-faNa text-lg font-bold text-text-light md:text-2xl dark:text-text-dark`}
      >
        {finalPrice === 0 ? 'رایگان' : finalPrice.toLocaleString('fa-IR')}
        {finalPrice !== 0 && <span className='mr-1 text-2xs'>تومان</span>}
      </span>
      {discount !== 0 && (
        <div className='flex gap-4'>
          <div className='flex w-fit items-center justify-center rounded-full border border-red bg-red bg-opacity-90 px-2 md:px-3 dark:bg-opacity-40'>
            <p className='font-faNa text-2xs font-bold text-white md:text-xs'>
              {discount}%
            </p>
          </div>
          <div>
            <p className='inline font-faNa text-sm font-bold text-priceText line-through md:text-lg'>
              {price.toLocaleString('fa-IR')}
            </p>
            <span className='mr-1 text-2xs text-priceText'>تومان</span>
          </div>
        </div>
      )}
    </div>
  );
}

Price.propTypes = {
  discount: PropTypes.number,
  className: PropTypes.string,
  price: PropTypes.number.isRequired,
  finalPrice: PropTypes.number.isRequired,
};
