/* eslint-disable no-undef */

'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import { usePathname, useRouter } from 'next/navigation';

import { useDispatch } from 'react-redux';

import Price from '../Price/Price';
import Modal from '../modules/Modal/Modal';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

import { addToCart } from '@/libs/redux/features/cartSlice';

import { LuLogIn } from 'react-icons/lu';

import { HiOutlineCheckBadge, HiOutlineShoppingBag } from 'react-icons/hi2';

const CoursePriceCard = ({
  className = '',
  discount = 0,
  price,
  finalPrice,
  courseId,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const { isAuthenticated } = useAuthUser();

  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const isFree = Number(finalPrice || 0) === 0;

  const handleAddCourseToCart = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsLoading(true);

      const result = await dispatch(addToCart(courseId));

      if (result?.meta?.requestStatus === 'fulfilled') {
        toast.showSuccessToast(
          isFree ? 'دوره با موفقیت اضافه شد' : 'دوره به سبد خرید اضافه شد'
        );

        router.push('/cart');
        return;
      }

      toast.showErrorToast(
        result?.payload?.message ||
          result?.payload ||
          'خطا در افزودن دوره به سبد خرید'
      );
    } catch (error) {
      console.error('[COURSE_ADD_TO_CART_ERROR]', error);

      toast.showErrorToast('خطا در افزودن دوره به سبد خرید');
    } finally {
      setIsLoading(false);
    }
  };

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);

    router.push('/login');
  };

  return (
    <>
      <SiteCard
        variant='soft'
        padding='sm'
        radius='md'
        className={`flex h-full flex-col ${className}`}
      >
        <div className='flex items-center justify-between gap-2'>
          <div>
            <p className='text-[9px] font-bold text-secondary'>ثبت‌نام مستقل</p>

            <h2 className='mt-0.5 text-sm font-black text-text-light dark:text-text-dark'>
              خرید دائمی دوره
            </h2>
          </div>

          <SiteBadge variant='secondary' size='sm'>
            دسترسی همیشگی
          </SiteBadge>
        </div>

        <div className='mt-3'>
          <Price
            discount={Number(discount || 0)}
            finalPrice={Number(finalPrice || 0)}
            price={Number(price || 0)}
          />
        </div>

        <div className='mt-3 flex items-start gap-1.5 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
          <HiOutlineCheckBadge
            size={15}
            className='mt-1 shrink-0 text-secondary'
          />

          <span>بدون نیاز به تمدید اشتراک</span>
        </div>

        <SiteButton
          type='button'
          variant='primary'
          size='md'
          startIcon={HiOutlineShoppingBag}
          loading={isLoading}
          disabled={isLoading}
          onClick={handleAddCourseToCart}
          fullWidth
          className='mt-3'
        >
          {isFree ? 'شروع رایگان' : 'خرید دوره'}
        </SiteButton>
      </SiteCard>

      {showLoginModal && (
        <Modal
          title='ورود یا ساخت حساب کاربری'
          desc='برای تهیه دوره ابتدا وارد حساب کاربری خود شوید یا یک حساب جدید بسازید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={loginHandler}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت‌نام'
          secondaryButtonText='لغو'
        />
      )}
    </>
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
