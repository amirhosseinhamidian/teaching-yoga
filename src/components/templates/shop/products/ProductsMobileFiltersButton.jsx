'use client';

import React from 'react';

import PropTypes from 'prop-types';

import SiteButton from '@/components/SiteUi/Button/SiteButton';

import { HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';

export default function ProductsMobileFiltersButton({ onClick }) {
  return (
    <SiteButton
      type='button'
      variant='outline'
      size='sm'
      startIcon={HiOutlineAdjustmentsHorizontal}
      onClick={onClick}
    >
      فیلترها
    </SiteButton>
  );
}

ProductsMobileFiltersButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
