'use client';
import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';

const SearchFilterTickets = ({
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
        placeholder=' جست و جو براساس موضوع'
      />
      <SimpleDropdown
        options={[
          { label: 'همه تیکت ها', value: 'ALL' },
          { label: 'در انتظار بررسی', value: 'PENDING' },
          { label: 'در حال بررسی', value: 'IN_PROGRESS' },
          {
            label: 'پاسخ داده شده (خوانده نشده توسط کاربر)',
            value: 'ANSWERED',
          },
          { label: 'باز', value: 'OPEN' },
          { label: 'بسته', value: 'CLOSED' },
        ]}
        value={filterStatus}
        onChange={setFilterStatus}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
    </div>
  );
};

SearchFilterTickets.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
};

export default SearchFilterTickets;
