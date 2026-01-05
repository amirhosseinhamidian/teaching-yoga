'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { FiFilter } from 'react-icons/fi';
import SearchBox from '@/app/a-panel/components/modules/SearchBox/SearchBox';

export default function ProductsHeadAction({
  searchValue,
  onSearchChange,
  onOpenFilters,
  sortValue,
  onSortChange,
  canPriceSort,
}) {
  const sortOptions = canPriceSort
    ? [
        { label: 'جدیدترین', value: 'newest' },
        { label: 'ارزان‌ترین', value: 'price_asc' },
        { label: 'گران‌ترین', value: 'price_desc' },
      ]
    : [{ label: 'جدیدترین', value: 'newest' }];

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
        محصولات فروشگاه
      </h1>

      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <SearchBox
          value={searchValue}
          onChange={onSearchChange}
          onSearch={() => {}}
          placeholder='جستجو در محصولات...'
        />

        <div className='w-full sm:w-56'>
          <DropDown
            label='مرتب‌سازی'
            options={sortOptions}
            value={sortValue}
            onChange={onSortChange}
            fullWidth
          />
        </div>

        <Button
          shadow
          className='flex items-center gap-2'
          onClick={onOpenFilters}
        >
          <FiFilter size={18} />
          فیلترها
        </Button>
      </div>
    </div>
  );
}

ProductsHeadAction.propTypes = {
  searchValue: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onOpenFilters: PropTypes.func.isRequired,
  sortValue: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  canPriceSort: PropTypes.bool.isRequired,
};
