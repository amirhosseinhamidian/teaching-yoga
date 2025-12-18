/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Ui/Button/Button';
import Price from '../Price/Price';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '../modules/Modal/Modal';
import { LuLogIn } from 'react-icons/lu';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';

import { addToCart } from '@/libs/redux/features/cartSlice'; // ✔️ مسیر صحیح
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const CoursePriceCard = ({
  className,
  discount,
  price,
  finalPrice,
  courseId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const { isAuthenticated } = useAuthUser(); // ✔️ مهم
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  // -------------------------
  // Add to Cart Handler
  // -------------------------
  const handleAddCourseToCart = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);

    const result = await dispatch(addToCart(courseId));
    setIsLoading(false);

    if (result.meta.requestStatus === 'fulfilled') {
      toast.showSuccessToast('به سبد خرید اضافه شد!');
      router.push('/cart');
    } else {
      const errorMessage =
        result.payload?.message ||
        result.payload ||
        'خطا در افزودن به سبد خرید';

      toast.showErrorToast(errorMessage);
    }
  };

  // -------------------------
  // Login Redirect Handler
  // -------------------------
  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  return (
    <div
      className={`flex flex-col justify-between gap-10 rounded-xl bg-surface-light p-4 shadow sm:gap-6 dark:bg-surface-dark ${className}`}
    >
      <h4 className='mr-4 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
        هزینه و ثبت نام همیشگی
      </h4>
      <Price
        className='ml-4'
        discount={discount}
        finalPrice={finalPrice}
        price={price}
      />

      <Button
        shadow
        className='w-full self-end text-xs xs:text-base'
        onClick={handleAddCourseToCart}
        isLoading={isLoading}
      >
        ثبت نام
      </Button>

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
