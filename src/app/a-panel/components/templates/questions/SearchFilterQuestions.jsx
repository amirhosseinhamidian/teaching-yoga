import React from 'react';
import PropTypes from 'prop-types';
import SearchBox from '../../modules/SearchBox/SearchBox';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';

const SearchFilterQuestions = ({
  className,
  searchText,
  setSearchText,
  isAnswered,
  setIsAnswered,
}) => {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      <SearchBox
        value={searchText}
        onChange={setSearchText}
        placeholder=' جست و جو براساس سوال یا دوره'
      />
      <SimpleDropdown
        options={[
          { label: 'همه سوال ها', value: 'all' },
          { label: 'پاسخ داده شده', value: 'true' },
          { label: 'پاسخ داده نشده', value: 'false' },
        ]}
        value={isAnswered}
        onChange={setIsAnswered}
        className='flex w-fit items-center justify-center rounded-xl border border-subtext-light px-2 text-xs text-subtext-light md:text-sm dark:border-subtext-dark dark:text-subtext-dark'
      />
    </div>
  );
};

SearchFilterQuestions.propTypes = {
  className: PropTypes.string,
  searchText: PropTypes.string.isRequired,
  setSearchText: PropTypes.func.isRequired,
  isAnswered: PropTypes.bool.isRequired,
  setIsAnswered: PropTypes.func.isRequired,
};

export default SearchFilterQuestions;
