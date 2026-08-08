/* eslint-disable no-undef */

'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { usePathname, useRouter } from 'next/navigation';

import Modal from '../modules/Modal/Modal';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteIconButton from '@/components/SiteUi/Button/SiteIconButton';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useCartActions } from '@/hooks/cart/useCartActions';

import { LuLogIn } from 'react-icons/lu';
import { PiCrownSimple } from 'react-icons/pi';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineShoppingBag,
} from 'react-icons/hi2';

const CardActions = ({
  mainBtnClick,
  courseId,
  className = '',
  subscriptionMode = 'TERM_ONLY',
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const { user } = useAuthUser();

  const { addToCart } = useCartActions();

  const [isLoading, setIsLoading] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const canBuy =
    subscriptionMode === 'TERM_ONLY' || subscriptionMode === 'BOTH';

  const canSubscribe =
    subscriptionMode === 'SUBSCRIPTION_ONLY' || subscriptionMode === 'BOTH';

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      setIsLoading(true);

      const response = await addToCart(courseId);

      toast.showSuccessToast(response?.message || 'دوره به سبد خرید اضافه شد');
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message;

      toast.showErrorToast(errorMessage || 'خطا در افزودن دوره به سبد خرید');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    sessionStorage.setItem('previousPage', pathname);

    router.push('/login');
  };

  return (
    <>
      <div className={`flex w-full items-center gap-2 ${className}`}>
        <SiteButton
          type='button'
          size='md'
          variant='primary'
          startIcon={HiOutlineBookOpen}
          endIcon={HiOutlineArrowLeft}
          onClick={mainBtnClick}
          className='min-w-0 flex-1'
        >
          مشاهده جزئیات
        </SiteButton>

        {canSubscribe && (
          <SiteIconButton
            type='button'
            size='md'
            variant='yellow'
            icon={PiCrownSimple}
            ariaLabel='مشاهده پلن‌های اشتراک'
            title='مشاهده پلن‌های اشتراک'
            onClick={() => router.push('/subscriptions')}
          />
        )}

        {canBuy && (
          <SiteIconButton
            type='button'
            size='md'
            variant='secondary'
            icon={HiOutlineShoppingBag}
            ariaLabel='افزودن دوره به سبد خرید'
            title='افزودن به سبد خرید'
            loading={isLoading}
            disabled={isLoading}
            onClick={handleAddToCart}
          />
        )}
      </div>

      {showLoginModal && (
        <Modal
          title='ورود یا ساخت حساب کاربری'
          desc='برای افزودن دوره به سبد خرید، ابتدا وارد حساب کاربری خود شوید یا یک حساب جدید بسازید.'
          icon={LuLogIn}
          iconSize={36}
          primaryButtonClick={handleLogin}
          secondaryButtonClick={() => setShowLoginModal(false)}
          primaryButtonText='ورود | ثبت‌نام'
          secondaryButtonText='لغو'
        />
      )}
    </>
  );
};

CardActions.propTypes = {
  mainBtnClick: PropTypes.func.isRequired,

  className: PropTypes.string,

  courseId: PropTypes.number.isRequired,

  subscriptionMode: PropTypes.oneOf(['TERM_ONLY', 'SUBSCRIPTION_ONLY', 'BOTH']),
};

export default CardActions;
