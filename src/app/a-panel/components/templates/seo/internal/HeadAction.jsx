import Button from '@/components/Ui/Button/Button';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Link from 'next/link';
import React from 'react';

const HeadAction = () => {
  return (
    <div className='flex items-center justify-between'>
      <PageTitle>سئو صفحات داخلی</PageTitle>
      <Link href='/a-panel/seo/internal/form'>
        <Button className='text-xs sm:text-sm lg:text-base' shadow>
          ثبت اطلاعات سئو
        </Button>
      </Link>
    </div>
  );
};

export default HeadAction;
