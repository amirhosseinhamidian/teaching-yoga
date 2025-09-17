import React from 'react';
import PropTypes from 'prop-types';
import { IoIosSearch } from 'react-icons/io';

const SearchBox = ({
  placeholder = 'جست و جو کنید...',
  focus = false,
  value,
  onChange,
  onSearch,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };
  return (
    <div className='flex w-fit items-center rounded-xl border border-accent bg-surface-light p-1 dark:bg-surface-dark'>
      <input
        type='text'
        placeholder={placeholder}
        autoFocus={focus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className='mr-2 shrink border-none bg-transparent font-faNa text-sm outline-none xs:w-52 sm:w-60 sm:text-base'
      />
      <button
        onClick={() => onSearch && onSearch(value)}
        className='rounded-xl bg-accent p-2 shadow-search active:opacity-75'
      >
        <IoIosSearch className='h-4 w-4 text-white sm:h-6 sm:w-6' size={24} />
      </button>
    </div>
  );
};

SearchBox.propTypes = {
  placeholder: PropTypes.string,
  focus: PropTypes.bool,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func,
};

export default SearchBox;
