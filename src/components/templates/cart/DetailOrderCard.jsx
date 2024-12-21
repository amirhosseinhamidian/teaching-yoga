'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { MdOutlineDiscount } from 'react-icons/md';

const DetailOrderCard = ({ data, className }) => {
  const [discountCode, setDiscountCode] = useState('');
  return (
    <div
      className={`rounded-xl bg-surface-light p-6 sm:p-8 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>جزئیات سفارش</h2>
      <div className='flex w-full items-center justify-between'>
        <h3 className='font-medium'>کل مبلغ</h3>
        <div className='flex items-baseline gap-1'>
          <h3 className='font-faNa text-base font-semibold sm:text-lg'>
            {data.totalPriceWithoutDiscount.toLocaleString('fa-IR')}
          </h3>
          <h6 className='text-2xs sm:text-xs'>تومان</h6>
        </div>
      </div>
      <div className='mt-2 flex w-full items-center justify-between sm:mt-3'>
        <h3 className='font-medium'>تخفیف</h3>
        <div className='flex items-baseline gap-1 text-red'>
          <h3 className='font-faNa text-base font-semibold sm:text-lg'>
            {data.totalDiscount.toLocaleString('fa-IR')}
          </h3>
          <h6 className='text-2xs sm:text-xs'>تومان</h6>
        </div>
      </div>
      <hr className='my-3 border-t border-gray-300 sm:my-4 dark:border-gray-700' />
      <div className='flex w-full items-center justify-between'>
        <h3 className='font-medium'>کل مبلغ</h3>
        <div className='flex items-baseline gap-1 text-green'>
          <h3 className='font-faNa text-lg font-semibold sm:text-xl'>
            {data.totalPrice.toLocaleString('fa-IR')}
          </h3>
          <h6 className='text-2xs sm:text-xs'>تومان</h6>
        </div>
      </div>
      <div className='my-10 flex w-full items-center gap-2 sm:flex-wrap sm:gap-4'>
        <div className='relative xs:w-full xs:flex-1'>
          <Input
            value={discountCode}
            onChange={setDiscountCode}
            placeholder='کد تخفیف'
            fontDefault={false}
            className='w-full pr-10'
            isUppercase
          />
          <MdOutlineDiscount
            size={20}
            className='absolute right-2 top-2.5 text-subtext-light dark:text-subtext-dark'
          />
        </div>
        <Button className='text-xs sm:text-sm' shadow>
          ثبت
        </Button>
      </div>
      <div className='flex w-full justify-center'>
        <Button className='mb-2 w-full sm:mb-4 sm:w-2/3' shadow>
          ادامه تسویه حساب
        </Button>
      </div>
    </div>
  );
};

DetailOrderCard.propTypes = {
  data: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default DetailOrderCard;
