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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const handleAddCourseToCart = async () => {
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
};

CoursePriceCard.propTypes = {
  discount: PropTypes.number,
  className: PropTypes.string,
  price: PropTypes.number.isRequired,
  finalPrice: PropTypes.number.isRequired,
  courseId: PropTypes.number.isRequired,
};

export default CoursePriceCard;
