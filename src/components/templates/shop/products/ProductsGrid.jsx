'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import ProductCard from './ProductCard';

export default function ProductsGrid({
  items,
  loading,
  emptyText,
  onClearFilters,
}) {
  if (loading) {
    return (
      <div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className='h-56 animate-pulse rounded-2xl bg-foreground-light dark:bg-foreground-dark'
          />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className='mt-10 rounded-2xl bg-foreground-light p-6 text-center text-sm dark:bg-foreground-dark'>
        <div className='mb-4'>{emptyText}</div>

        {!!onClearFilters && (
          <div className='flex justify-center'>
            <Button shadow className='text-xs' onClick={onClearFilters}>
              حذف فیلترها و نمایش همه محصولات
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='mt-6 grid grid-cols-1 gap-3 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
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
