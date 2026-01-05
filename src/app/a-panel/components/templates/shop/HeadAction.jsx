'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { FiSettings } from 'react-icons/fi';

const HeadAction = ({ onOpenSettings }) => {
  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
        مدیریت فروشگاه
      </h1>

      <Button
        onClick={onOpenSettings}
        className='flex items-center gap-2'
        size='sm'
      >
        <FiSettings size={18} />
        تنظیمات فروشگاه
      </Button>
    </div>
  );
};

HeadAction.propTypes = {
  onOpenSettings: PropTypes.func.isRequired,
};

export default HeadAction;
