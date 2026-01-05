import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';

const SearchFilterMessages = ({
  className,
  searchText,
  setSearchText,
  isSeen,
  setIsSeen,
}) => {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      <SearchBox
        value={searchText}
        onChange={setSearchText}
        placeholder=' جست و جو براساس متن پیام'
      />
      <SimpleDropdown
        options={[
          { label: 'همه پیام ها', value: 'all' },
          { label: 'خوانده شده', value: 'true' },
          { label: 'خوانده نشده', value: 'false' },
        ]}
        value={isSeen}
        onChange={setIsSeen}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
    </div>
  );
};

SearchFilterMessages.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
  isSeen: PropTypes.bool.isRequired,
  setIsSeen: PropTypes.func.isRequired,
};

export default SearchFilterMessages;
