'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import SearchBox from '../../../modules/SearchBox/SearchBox';

const HeadActionCategories = ({ onCreateClick, onSearch }) => {
  const [q, setQ] = useState('');

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
        مدیریت دسته‌بندی‌ها
      </h1>

      <div className='flex flex-col gap-3 xs:flex-row xs:items-center'>
        <SearchBox
          value={q}
          onChange={setQ}
          onSearch={() => onSearch(q)}
          placeholder='جستجو در عنوان یا اسلاگ...'
        />
        <Button shadow onClick={onCreateClick}>
          ساخت دسته‌بندی جدید
        </Button>
      </div>
    </div>
  );
};

HeadActionCategories.propTypes = {
  onCreateClick: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
};

export default HeadActionCategories;
