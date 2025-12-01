'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { MdOutlineDiscount } from 'react-icons/md';
import Link from 'next/link';

import { useCart } from '@/hooks/cart/useCart';
import { useCartActions } from '@/hooks/cart/useCartActions';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

export default function DetailOrderCard({ className }) {
  const {
    cartId,
    totalPrice,
    totalPriceWithoutDiscount,
    totalDiscount,
    loading,
  } = useCart();

  const { applyDiscount } = useCartActions();
  const { user } = useAuthUser();

  console.log('cartid ========> ', cartId);

  const [discountCode, setDiscountCode] = useState('');

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // 🍀 اعمال کد تخفیف
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;

    const res = await applyDiscount({ code: discountCode, cartId });

    if (res.meta.requestStatus === 'fulfilled') {
      toast.showSuccessToast('کد تخفیف با موفقیت اعمال شد');
    } else {
      toast.showErrorToast(res.payload || 'کد تخفیف معتبر نیست');
    }
  };

  // Helpers
  const formatPrice = (value) => {
    if (value === 0) return 'رایگان';
    return `${value?.toLocaleString('fa-IR')} تومان`;
  };
  const formatDiscount = (value) => {
    if (value === 0) return '-';
    return `${value?.toLocaleString('fa-IR')} تومان`;
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 shadow sm:p-8 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-6 text-lg font-semibold md:text-xl'>جزئیات سفارش</h2>

      {/* قیمت بدون تخفیف */}
      <div className='flex justify-between'>
        <span className='font-medium'>کل مبلغ</span>
        <span className='font-faNa text-base'>
          {formatPrice(totalPriceWithoutDiscount)}
        </span>
      </div>

      {/* مقدار تخفیف */}
      <div className='mt-3 flex justify-between'>
        <span className='font-medium'>تخفیف</span>
        <span className='font-faNa text-base text-red'>
          {formatDiscount(totalDiscount)}
        </span>
      </div>

      <hr className='my-4 border-gray-300 dark:border-gray-700' />

      {/* مبلغ قابل پرداخت */}
      <div className='flex justify-between'>
        <span className='font-medium'>مبلغ قابل پرداخت</span>
        <span className='font-faNa text-lg font-bold text-green'>
          {formatPrice(totalPrice)}
        </span>
      </div>

      {/* اگر رایگان نبود → امکان ثبت کد تخفیف */}
      {totalPrice !== 0 ? (
        <>
          {/* کد تخفیف */}
          <div className='mx-auto mb-6 mt-8 flex w-full items-center gap-2 sm:flex-wrap sm:gap-4 xl:w-3/4'>
            <div className='relative w-full xs:flex-1'>
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

            <Button
              shadow
              onClick={handleApplyDiscount}
              isLoading={loading}
              className='text-xs sm:text-sm'
            >
              ثبت
            </Button>
          </div>

          {/* دکمه پرداخت */}
          <Link className='flex w-full justify-center' href='/payment'>
            <Button
              className='mb-2 flex w-full items-center justify-center gap-1 sm:mb-4'
              shadow
            >
              تایید و ادامه پرداخت
            </Button>
          </Link>
        </>
      ) : (
        // اگر کل مبلغ 0 باشد → فقط دکمه افزودن دوره رایگان
        <Button className='mt-10 w-full sm:mb-4' shadow>
          افزودن دوره رایگان
        </Button>
      )}
    </div>
  );
}

DetailOrderCard.propTypes = {
  className: PropTypes.string,
};
