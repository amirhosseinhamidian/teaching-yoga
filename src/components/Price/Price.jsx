import React from 'react';
import PropTypes from 'prop-types';

const toSafeNumber = (value) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const Price = ({ finalPrice, discount = 0, price, className = '' }) => {
  const normalizedFinalPrice = toSafeNumber(finalPrice);

  const normalizedPrice = toSafeNumber(price);

  const normalizedDiscount = Math.max(toSafeNumber(discount), 0);

  const hasDiscount =
    normalizedDiscount > 0 && normalizedPrice > normalizedFinalPrice;

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <p className='text-[10px] font-bold text-subtext-light dark:text-subtext-dark'>
        مبلغ قابل پرداخت
      </p>

      <div className='mt-1 flex flex-wrap items-baseline gap-1.5'>
        {normalizedFinalPrice === 0 ? (
          <span className='text-2xl font-black text-secondary sm:text-3xl'>
            رایگان
          </span>
        ) : (
          <>
            <span className='font-faNa text-2xl font-black text-text-light sm:text-3xl dark:text-text-dark'>
              {normalizedFinalPrice.toLocaleString('fa-IR')}
            </span>

            <span className='text-xs font-bold text-subtext-light dark:text-subtext-dark'>
              تومان
            </span>
          </>
        )}
      </div>

      {hasDiscount && (
        <div className='mt-2 flex flex-wrap items-center gap-3'>
          <span className='rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-faNa text-[10px] font-black text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'>
            {normalizedDiscount.toLocaleString('fa-IR')}٪ تخفیف
          </span>

          <span className='font-faNa text-xs text-subtext-light line-through sm:text-sm dark:text-subtext-dark'>
            {normalizedPrice.toLocaleString('fa-IR')}
            تومان
          </span>
        </div>
      )}
    </div>
  );
};

Price.propTypes = {
  discount: PropTypes.number,
  className: PropTypes.string,
  price: PropTypes.number.isRequired,
  finalPrice: PropTypes.number.isRequired,
};

export default Price;
