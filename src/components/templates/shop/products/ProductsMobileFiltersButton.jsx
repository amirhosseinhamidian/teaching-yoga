'use client';
import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { TbFilter } from 'react-icons/tb';

export default function ProductsMobileFiltersButton({ onClick }) {
  return (
    <Button shadow className='text-xs' onClick={onClick}>
      <span className='flex items-center gap-2'>
        <TbFilter size={18} />
        فیلتر و جستجو
      </span>
    </Button>
  );
}

ProductsMobileFiltersButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
