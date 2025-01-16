'use client';
import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';

const SearchFilterSessions = ({
  className,
  searchText,
  setSearchText,
  filterCourse,
  setFilterCourse,
  filterTerm,
  setFilterTerm,
  courseOptions,
  termOptions,
}) => {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      <SearchBox
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder=' جست و جو براساس نام جلسه'
      />
      <SimpleDropdown
        options={courseOptions}
        value={filterCourse}
        onChange={setFilterCourse}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
      <SimpleDropdown
        options={termOptions}
        value={filterTerm}
        onChange={setFilterTerm}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
    </div>
  );
};

SearchFilterSessions.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
  filterCourse: PropTypes.string.isRequired,
  setFilterCourse: PropTypes.func.isRequired,
  filterTerm: PropTypes.string.isRequired,
  setFilterTerm: PropTypes.func.isRequired,
  courseOptions: PropTypes.array.isRequired,
  termOptions: PropTypes.array.isRequired,
};

export default SearchFilterSessions;
