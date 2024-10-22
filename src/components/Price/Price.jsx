"use client"

import React from 'react';
import PropTypes from 'prop-types';
import { calculateDiscount } from '@/utils/calculateDiscount';

export default function Price({ basePrice, price, className }) {
  console.log(price)
  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span className='font-faNa text-lg font-bold text-text-light md:text-2xl dark:text-text-dark'>
          {price.toLocaleString()}
          <span className='mr-1 text-2xs'>تومان</span>
        </span>
      {basePrice && (
        <div className='flex gap-4'>
        <div className='flex w-fit items-center justify-center rounded-full border border-red bg-red bg-opacity-90 px-2 md:px-3 dark:bg-opacity-40'>
            <p className='md:text-sx font-faNa text-sm font-bold text-white'>
              {calculateDiscount(price, basePrice)}%
            </p>
          </div>
          <div>
            <p className='text-priceText inline font-faNa text-sm font-bold line-through md:text-lg'>
              {basePrice.toLocaleString()}
            </p>
            <span className='text-priceText mr-1 text-2xs'>تومان</span>
          </div>
        </div>
      )}
    </div>
  );
}

Price.propTypes = {
  basePrice: PropTypes.string,
  className: PropTypes.string,
  price: PropTypes.string.isRequired,
};
