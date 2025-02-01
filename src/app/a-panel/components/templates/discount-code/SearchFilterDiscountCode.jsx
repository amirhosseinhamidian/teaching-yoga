'use client';
import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';

const SearchFilterDiscountCode = ({
  className,
  searchText,
  setSearchText,
  filter,
  setFilter,
}) => {
  const discountCodeOptions = [
    { label: 'همه', value: '' },
    { label: 'فعال', value: true },
    { label: 'غیرفعال', value: false },
  ];
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      <SearchBox
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder=' جست و جو براساس عنوان کد تخفیف'
      />
      <SimpleDropdown
        options={discountCodeOptions}
        value={filter}
        onChange={setFilter}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
    </div>
  );
};

SearchFilterDiscountCode.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
  filter: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
};

export default SearchFilterDiscountCode;
