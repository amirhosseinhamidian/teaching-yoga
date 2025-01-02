/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import Button from '../Ui/Button/Button';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { BiCartAdd } from 'react-icons/bi';
import PropTypes from 'prop-types';
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

export default function CardActions({ mainBtnClick, courseId, className }) {
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { setUser } = useAuth();

  const addToCart = async () => {
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
    <div className={`flex items-center gap-4 ${className}`}>
      <Button
        onClick={mainBtnClick}
        shadow
        className='w-full text-xs sm:text-sm md:text-base'
      >
        مشاهده جزییات
      </Button>
      {isLoading ? (
        <IconButton loading />
      ) : (
        <IconButton icon={BiCartAdd} onClick={addToCart} size={28} />
      )}
    </div>
  );
}

CardActions.propTypes = {
  mainBtnClick: PropTypes.func,
  subBtnClick: PropTypes.func,
  className: PropTypes.string,
  courseId: PropTypes.number.isRequired,
};
