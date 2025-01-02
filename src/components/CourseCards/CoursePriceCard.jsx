/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Ui/Button/Button';
import Price from '../Price/Price';
import { ImSpinner2 } from 'react-icons/im';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

async function addCourseToCart(courseId) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, cart: data };
  } catch (error) {
    console.error('Error in API call:', error.message);
    return { success: false, error: error.message };
  }
}

const CoursePriceCard = ({
  className,
  discount,
  price,
  finalPrice,
  courseId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { setUser } = useAuth();
  const handleAddCourseToCart = async () => {
    setIsLoading(true);
    const result = await addCourseToCart(courseId);
    setIsLoading(false);
    if (result.success) {
      const userRes = await fetch('/api/get-me');
      const user = await userRes.json();
      if (user.success) {
        setUser(user.user);
      }
      toast.showSuccessToast(result.cart.message);
    } else {
      toast.showErrorToast(result.error);
    }
  };
  return (
    <div
      className={`mx-auto rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
    >
      <h4 className='mr-4 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
        هزینه و ثبت نام
      </h4>
      <div className='mb-2 mt-2 flex w-full flex-col-reverse flex-wrap items-end justify-between gap-6 md:mt-4 lg:flex-row lg:gap-1'>
        <Button
          shadow
          className='flex w-3/4 items-center justify-center gap-1 self-center text-xs xs:text-base sm:py-3 lg:w-2/4'
          onClick={handleAddCourseToCart}
          disable={isLoading}
        >
          افزودن به سبد خرید
          {isLoading && <ImSpinner2 className='mr-2 animate-spin' />}
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
  courseId: PropTypes.number.isRequired,
};

export default CoursePriceCard;
