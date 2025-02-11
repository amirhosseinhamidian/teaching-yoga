'use client';
import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';

const SearchArticles = ({ className, searchText, setSearchText }) => {
  return (
    <div className={`flex flex-wrap justify-between gap-4 ${className}`}>
      <h2 className='text-sm font-semibold sm:text-base md:text-lg lg:text-xl xl:text-2xl'>
        لیست مقالات
      </h2>
      <SearchBox
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder=' جست و جو براساس عنوان مقاله'
      />
    </div>
  );
};

SearchArticles.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
};

export default SearchArticles;
