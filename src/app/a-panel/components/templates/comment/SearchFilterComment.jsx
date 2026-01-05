'use client';
import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';

const SearchFilterComment = ({
  className,
  searchText,
  setSearchText,
  filterStatus,
  setFilterStatus,
}) => {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      <SearchBox
        value={searchText}
        onChange={setSearchText}
        placeholder=' جست و جو براساس کاربر یا محتوای نظر'
      />
      <SimpleDropdown
        options={[
          { label: 'همه نظرات', value: 'ALL' },
          { label: 'تایید شده', value: 'APPROVED' },
          { label: 'رد شده', value: 'REJECTED' },
          { label: 'در انتظار تایید', value: 'PENDING' },
        ]}
        value={filterStatus}
        onChange={setFilterStatus}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
    </div>
  );
};

SearchFilterComment.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
};

export default SearchFilterComment;
