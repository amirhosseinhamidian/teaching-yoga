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
import { updateUser } from '@/app/actions/updateUser';
import Modal from '../modules/Modal/Modal';
import { LuLogIn } from 'react-icons/lu';
import { usePathname, useRouter } from 'next/navigation';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user, setUser } = useAuth();

  const addToCart = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIsLoading(true);
    const result = await addCourseToCart(courseId);
    setIsLoading(false);
    if (result.success) {
      await updateUser(setUser);
      toast.showSuccessToast(result.cart.message);
    } else {
      toast.showErrorToast(result.error);
    }
  };

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
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
      {showLoginModal && (
        <Modal
          title='ثبت نام یا ورود به حساب کاربری'
          desc='برای تهیه دوره لطفا ابتدا وارد حساب کاربری خود شوید یا در سایت ثبت نام کنید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت نام'
          secondaryButtonText='لغو'
        />
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
