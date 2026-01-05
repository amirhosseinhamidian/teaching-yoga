import React from 'react';
import PropTypes from 'prop-types';
import { IoIosSearch } from 'react-icons/io';

const SearchBox = ({
  placeholder = 'جست و جو کنید...',
  focus = false,
  value,
  onChange,
  onSearch,
  className,
  inputClassName,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };
  return (
    <div
      className={`flex items-center justify-between rounded-xl border border-accent bg-surface-light p-1 dark:bg-surface-dark ${className ? className : 'w-fit'}`}
    >
      <input
        type='text'
        placeholder={placeholder}
        autoFocus={focus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`mr-2 w-full shrink border-none bg-transparent font-faNa outline-none ${inputClassName ? inputClassName : 'text-sm sm:text-base'}`}
      />
      <button
        onClick={() => onSearch && onSearch(value)}
        className='rounded-xl bg-accent p-2 shadow-search active:opacity-75'
      >
        <IoIosSearch className='text-white' size={20} />
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
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

export default SearchBox;
