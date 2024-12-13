import React from 'react';
import PropTypes from 'prop-types';
import Button from '../Ui/Button/Button';
import Price from '../Price/Price';

const CoursePriceCard = ({ className, discount, price, finalPrice }) => {
  return (
    <div
      className={`mx-auto rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
    >
      <h4 className='mr-4 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
        هزینه و ثبت نام
      </h4>
      <div className='mb-2 mt-2 flex w-full flex-col-reverse flex-wrap items-end justify-between gap-6 md:mt-4 lg:flex-row lg:gap-1'>
        <Button shadow className='w-3/4 self-center sm:py-3 lg:w-2/4'>
          ثبت نام
        </Button>
        <Price
          className='ml-4'
          discount={discount}
          finalPrice={finalPrice}
          price={price}
        />
      </div>
    </div>
  );
};

CoursePriceCard.propTypes = {
  discount: PropTypes.number,
  className: PropTypes.string,
  price: PropTypes.number.isRequired,
  finalPrice: PropTypes.number.isRequired,
};

export default CoursePriceCard;
