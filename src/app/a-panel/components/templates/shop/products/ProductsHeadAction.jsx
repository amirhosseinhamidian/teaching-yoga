'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import SearchBox from '../../../modules/SearchBox/SearchBox';

const ProductsHeadAction = ({
  searchValue,
  onSearchChange,
  onSearch,
  onCreate,
}) => {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
        مدیریت محصولات
      </h1>

      <div className='flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-end'>
        <SearchBox
          placeholder='جستجو در محصولات...'
          value={searchValue}
          onChange={onSearchChange}
          onSearch={onSearch}
        />

        <Button onClick={onCreate} className='text-sm md:text-base' shadow>
          ساخت محصول جدید
        </Button>
      </div>
    </div>
  );
};

ProductsHeadAction.propTypes = {
  searchValue: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default ProductsHeadAction;
