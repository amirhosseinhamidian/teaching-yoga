'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import AddEditDiscountCodeModal from '../../modules/AddEditDiscountCodeModal/AddEditDiscountCodeModal';

const HeadAction = ({
  addDiscountCodeSuccessfully,
  courseOptions,
  className,
}) => {
  const [showAddDiscountCodeModal, setShowAddDiscountCodeModal] =
    useState(false);
  const handleAddDiscountCodeSuccessfully = (newDiscountCode) => {
    addDiscountCodeSuccessfully(newDiscountCode);
    setShowAddDiscountCodeModal(false);
  };
  return (
    <>
      <div
        className={`flex flex-wrap items-center justify-between gap-2${className}`}
      >
        <h1 className='text-base font-semibold xs:text-xl md:text-2xl'>
          مدیریت کدهای تخفیف
        </h1>
        <Button
          onClick={() => setShowAddDiscountCodeModal(true)}
          shadow
          className='flex items-center justify-center text-xs sm:text-sm md:text-base'
        >
          افزودن کد تخفیف
        </Button>
      </div>
      {showAddDiscountCodeModal && (
        <AddEditDiscountCodeModal
          onClose={() => setShowAddDiscountCodeModal(false)}
          courseOptions={courseOptions}
          onSuccess={(newDiscountCode) =>
            handleAddDiscountCodeSuccessfully(newDiscountCode)
          }
        />
      )}
    </>
  );
};

HeadAction.propTypes = {
  className: PropTypes.string,
  addDiscountCodeSuccessfully: PropTypes.func.isRequired,
  courseOptions: PropTypes.array.isRequired,
};

export default HeadAction;
