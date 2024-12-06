'use client';
import React, { useState } from 'react';
import SearchBox from '../../modules/SearchBox/SearchBox';
import Button from '@/components/Ui/Button/Button';
import Link from 'next/link';

const HeadActions = () => {
  const [searchText, setSearchText] = useState('');
  return (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <SearchBox
        placeholder=' جست و جو براساس نام دوره '
        value={searchText}
        onChange={setSearchText}
      />
      <Link href='/a-panel/course/create-course'>
        <Button shadow>ثبت دوره جدید</Button>
      </Link>
    </div>
  );
};

export default HeadActions;
