'use client';

import React from 'react';

import PropTypes from 'prop-types';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { HiOutlineShoppingBag } from 'react-icons/hi2';

import ProductCard from './ProductCard';

export default function ProductsGrid({
  items,
  loading,
  emptyText,
  onClearFilters,
}) {
  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {Array.from({
          length: 8,
        }).map((_, index) => (
          <SiteCard
            key={index}
            variant='glass'
            padding='none'
            radius='lg'
            className='overflow-hidden'
          >
            <div className='aspect-[4/3] animate-pulse bg-black/[0.045] dark:bg-white/[0.055]' />

            <div className='space-y-3 p-4'>
              <div className='h-4 w-4/5 animate-pulse rounded-full bg-black/[0.055] dark:bg-white/[0.06]' />

              <div className='h-4 w-2/3 animate-pulse rounded-full bg-black/[0.045] dark:bg-white/[0.05]' />

              <div className='my-4 h-px bg-black/5 dark:bg-white/10' />

              <div className='h-6 w-1/2 animate-pulse rounded-full bg-secondary/10' />
            </div>
          </SiteCard>
        ))}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty
  |--------------------------------------------------------------------------
  */

  if (!items || items.length === 0) {
    return (
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className='relative overflow-hidden px-5 py-12 text-center sm:py-16'
      >
        <div
          aria-hidden='true'
          className='absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[90px]'
        />

        <div className='relative z-10 mx-auto flex max-w-sm flex-col items-center'>
          <span className='flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
            <HiOutlineShoppingBag size={30} />
          </span>

          <h3 className='mt-4 text-base font-black text-text-light dark:text-text-dark'>
            محصولی پیدا نشد
          </h3>

          <p className='mt-2 text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
            {emptyText || 'محصولی برای نمایش وجود ندارد.'}
          </p>

          {Boolean(onClearFilters) && (
            <SiteButton
              type='button'
              variant='primary'
              size='md'
              onClick={onClearFilters}
              className='mt-5'
            >
              حذف فیلترها و نمایش همه
            </SiteButton>
          )}
        </div>
      </SiteCard>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Grid
  |--------------------------------------------------------------------------
  */

  return (
    <div className='grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

ProductsGrid.propTypes = {
  items: PropTypes.array.isRequired,

  loading: PropTypes.bool.isRequired,

  emptyText: PropTypes.string,

  onClearFilters: PropTypes.func,
};
