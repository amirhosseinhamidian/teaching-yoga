/* eslint-disable no-undef */
'use client';

import React, { useMemo, useState } from 'react';
import Button from '../Ui/Button/Button';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { BiCartAdd } from 'react-icons/bi';
import PropTypes from 'prop-types';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '../modules/Modal/Modal';
import { LuLogIn } from 'react-icons/lu';
import { usePathname, useRouter } from 'next/navigation';

// Redux
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useCartActions } from '@/hooks/cart/useCartActions';
import { PiCrownSimple } from 'react-icons/pi';

export default function CardActions({
  mainBtnClick,
  courseId,
  className,
  subscriptionMode, // TERM_ONLY | SUBSCRIPTION_ONLY | BOTH
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginReason, setLoginReason] = useState('cart'); // 'cart' | 'subscription'

  const pathname = usePathname();
  const router = useRouter();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const { user } = useAuthUser();
  const { addToCart } = useCartActions();

  const { showCartButton, showSubscribeButton } = useMemo(() => {
    const mode = subscriptionMode || 'TERM_ONLY';

    const canBuy = mode === 'TERM_ONLY' || mode === 'BOTH';
    const canSubscribe = mode === 'SUBSCRIPTION_ONLY' || mode === 'BOTH';

    return {
      showCartButton: canBuy,
      showSubscribeButton: canSubscribe,
    };
  }, [subscriptionMode]);

  const handleAddToCart = async () => {
    if (!user) {
      setLoginReason('cart');
      setShowLoginModal(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await addToCart(courseId);
      toast.showSuccessToast(response?.message || 'به سبد اضافه شد');
    } catch (err) {
      toast.showErrorToast(err || 'خطا در افزودن به سبد');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoSubscriptions = () => {
    router.push('/subscriptions');
  };

  const loginHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button
        onClick={mainBtnClick}
        shadow
        className='w-full text-xs sm:text-sm md:text-base'
      >
        مشاهده جزییات
      </Button>

      {/* ✅ دکمه اشتراک */}
      {showSubscribeButton && (
        <IconButton
          icon={PiCrownSimple}
          onClick={handleGoSubscriptions}
          size={28}
        />
      )}

      {/* ✅ دکمه سبد خرید */}
      {showCartButton &&
        (isLoading ? (
          <IconButton loading />
        ) : (
          <IconButton icon={BiCartAdd} onClick={handleAddToCart} size={28} />
        ))}

      {showLoginModal && (
        <Modal
          title='ثبت نام یا ورود به حساب کاربری'
          desc={
            loginReason === 'subscription'
              ? 'برای خرید اشتراک ابتدا وارد شوید.'
              : 'برای تهیه دوره ابتدا وارد شوید.'
          }
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
  className: PropTypes.string,
  courseId: PropTypes.number.isRequired,
  subscriptionMode: PropTypes.oneOf(['TERM_ONLY', 'SUBSCRIPTION_ONLY', 'BOTH']),
};
