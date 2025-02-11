import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { useRouter } from 'next/navigation';

const HeadAction = ({ className }) => {
  const router = useRouter();
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 ${className}`}
    >
      <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
        مدیریت بلاگ
      </h1>
      <Button
        onClick={() => router.push('/a-panel/blog/create')}
        shadow
        className='flex items-center justify-center text-xs sm:text-sm md:text-base'
      >
        مقاله جدید
      </Button>
    </div>
  );
};

HeadAction.propTypes = {
  className: PropTypes.string,
};

export default HeadAction;
