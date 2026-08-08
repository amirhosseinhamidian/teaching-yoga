/* eslint-disable react/prop-types */
'use client';

import React, { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import Logo from '../Logo/Logo';

import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import Button from '../Ui/Button/Button';

import NavbarMobileMenu from './NavbarMobileMenu';
import NavbarRoutes from './NavRoutes';

import ProfileModal from '../modules/ProfileModal/ProfileModal';
import CartModal from '../modules/CartModal/CartModal';
import Modal from '../modules/Modal/Modal';

import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlinePerson,
} from 'react-icons/md';

import { BsCart3 } from 'react-icons/bs';
import { LuLogOut } from 'react-icons/lu';

import { PiClockCountdownBold, PiCrownSimple } from 'react-icons/pi';

import { useTheme } from '@/contexts/ThemeContext';

import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const { isDark, toggleTheme } = useTheme();

  const { user } = useAuthUser();

  const { logout } = useUserActions();

  const { items: courseItems } = useCart();

  const { items: shopItems } = useShopCart();

  const [isShowProfileModal, setShowProfileModal] = useState(false);

  const [isShowCartModal, setIsShowCartModal] = useState(false);

  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const [subscriptionInfo, setSubscriptionInfo] = useState({
    loading: false,
    hasActiveSubscription: false,
    remainingDays: 0,
    planName: null,
  });

  /*
   * تعداد دوره‌های داخل سبد
   */
  const courseCount = useMemo(() => {
    return Array.isArray(courseItems) ? courseItems.length : 0;
  }, [courseItems]);

  /*
   * تعداد محصولات فروشگاه
   */
  const shopCount = useMemo(() => {
    if (!Array.isArray(shopItems)) {
      return 0;
    }

    return shopItems.reduce((sum, item) => {
      return sum + Number(item?.qty || 0);
    }, 0);
  }, [shopItems]);

  const cartCount = courseCount + shopCount;

  /*
   * دریافت وضعیت اشتراک
   */
  useEffect(() => {
    if (!user) {
      setSubscriptionInfo({
        loading: false,
        hasActiveSubscription: false,
        remainingDays: 0,
        planName: null,
      });

      return undefined;
    }

    let ignore = false;

    const fetchSubscriptionStatus = async () => {
      try {
        setSubscriptionInfo((previousValue) => ({
          ...previousValue,
          loading: true,
        }));

        const response = await fetch('/api/subscription/status', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data = await response.json();

        if (!ignore) {
          setSubscriptionInfo({
            loading: false,

            hasActiveSubscription: Boolean(data?.hasActiveSubscription),

            remainingDays: Number(data?.remainingDays || 0),

            planName: data?.planName || null,
          });
        }
      } catch (error) {
        console.error('[SUBSCRIPTION_STATUS_ERROR]', error);

        if (!ignore) {
          setSubscriptionInfo((previousValue) => ({
            ...previousValue,
            loading: false,
          }));
        }
      }
    };

    fetchSubscriptionStatus();

    return () => {
      ignore = true;
    };
  }, [user]);

  /*
   * ورود
   */
  const loginClickHandler = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('previousPage', pathname || '/');
    }

    router.push('/login');
  };

  /*
   * خروج
   */
  const signOutHandler = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout request failed');
      }

      logout();

      setShowSignOutModal(false);

      setShowProfileModal(false);

      router.refresh();
    } catch (error) {
      console.error('[LOGOUT_ERROR]', error);
    }
  };

  const openCartModal = () => {
    setIsShowCartModal(true);
  };

  const openProfileModal = () => {
    setShowProfileModal(true);
  };

  const openSubscriptions = () => {
    router.push('/subscriptions');
  };

  const isSubscriptionExpiringSoon =
    subscriptionInfo.hasActiveSubscription &&
    subscriptionInfo.remainingDays <= 7;

  return (
    <>
      <header className='fixed inset-x-0 top-4 z-20 px-3 sm:px-5 lg:top-5'>
        <div
          dir='rtl'
          className='container mx-auto flex h-16 w-full items-center justify-between rounded-[24px] border border-black/5 bg-surface-light/90 px-3 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-colors duration-300 sm:h-20 sm:px-5 lg:rounded-[28px] dark:border-white/10 dark:bg-surface-dark/90 dark:shadow-[0_18px_60px_rgba(0,0,0,0.30)]'
        >
          {/* =====================
              Logo + Navigation
              ===================== */}
          <div className='flex min-w-0 items-center gap-4 lg:gap-8'>
            <Link
              href='/'
              aria-label='صفحه اصلی سامانه یوگا'
              className='flex shrink-0 items-center'
            >
              <Logo />
            </Link>

            <nav className='hidden items-center md:flex'>
              <NavbarRoutes />
            </nav>
          </div>

          {/* =====================
              Desktop Actions
              ===================== */}
          <div className='hidden shrink-0 items-center gap-2 md:flex'>
            {user && (
              <>
                {subscriptionInfo.loading ? (
                  <div className='flex h-11 min-w-11 items-center justify-center rounded-2xl border border-black/5 bg-background-light dark:border-white/10 dark:bg-background-dark'>
                    <IconButton loading />
                  </div>
                ) : subscriptionInfo.hasActiveSubscription ? (
                  <button
                    type='button'
                    onClick={openSubscriptions}
                    className={`group flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl border px-3 font-faNa text-xs font-bold transition-all duration-300 hover:-translate-y-0.5 sm:px-4 ${
                      isSubscriptionExpiringSoon
                        ? 'border-red/20 bg-red/10 text-red hover:bg-red hover:text-white'
                        : 'border-secondary/20 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white'
                    }`}
                  >
                    <PiClockCountdownBold
                      size={21}
                      className='shrink-0 transition-transform duration-300 group-hover:scale-110'
                    />

                    <span className='flex items-center gap-1'>
                      <span className='hidden xl:inline'>
                        {subscriptionInfo.planName || 'اشتراک فعال'}
                      </span>

                      <span className='font-faNa text-sm'>
                        {subscriptionInfo.remainingDays.toLocaleString('fa-IR')}
                      </span>

                      <span>روز</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={openSubscriptions}
                    className='group flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl border border-secondary/20 bg-gradient-to-l from-secondary to-secondary/80 px-3 text-xs font-bold text-white shadow-[0_8px_24px_rgba(16,185,129,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.28)] sm:px-4'
                  >
                    <PiCrownSimple
                      size={22}
                      className='text-yellow shrink-0 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110'
                    />

                    <span>عضویت ویژه</span>
                  </button>
                )}
              </>
            )}

            <div className='flex h-12 items-center gap-1 rounded-2xl border border-black/5 bg-background-light/80 p-1 shadow-sm dark:border-white/10 dark:bg-background-dark/80'>
              {/* Theme */}
              <IconButton
                icon={isDark ? MdOutlineLightMode : MdOutlineDarkMode}
                onClick={toggleTheme}
                aria-label={
                  isDark ? 'فعال‌سازی حالت روشن' : 'فعال‌سازی حالت تاریک'
                }
              />

              <div className='h-6 w-px bg-black/5 dark:bg-white/10' />

              {/* =====================
                  Desktop Cart
                  مهم:
                  wrapper دیگر button نیست.
                  IconButton خودش button است.
                  ===================== */}
              <div className='relative flex items-center justify-center'>
                <IconButton
                  icon={BsCart3}
                  onClick={openCartModal}
                  aria-label='مشاهده سبد خرید'
                />

                {cartCount > 0 && (
                  <span className='pointer-events-none absolute -left-1 -top-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1 pt-0.5 font-faNa text-[10px] font-bold leading-none text-white shadow-md'>
                    {cartCount.toLocaleString('fa-IR')}
                  </span>
                )}
              </div>

              <div className='h-6 w-px bg-black/5 dark:bg-white/10' />

              {/* Account */}
              {user ? (
                <IconButton
                  icon={MdOutlinePerson}
                  onClick={openProfileModal}
                  aria-label='مشاهده حساب کاربری'
                />
              ) : (
                <Button
                  className='h-10 whitespace-nowrap rounded-xl px-3 text-xs lg:px-4 lg:text-sm'
                  onClick={loginClickHandler}
                >
                  ورود | ثبت‌نام
                </Button>
              )}
            </div>
          </div>

          {/* =====================
              Mobile Actions
              ===================== */}
          <div className='flex shrink-0 items-center gap-1.5 md:hidden'>
            {!user && (
              <button
                type='button'
                onClick={loginClickHandler}
                className='hidden h-10 items-center justify-center whitespace-nowrap rounded-xl bg-secondary px-3 text-xs font-bold text-white xs:flex'
              >
                ورود
              </button>
            )}

            {/* =====================
                Mobile Cart
                مهم:
                wrapper دیگر button نیست.
                ===================== */}
            <div className='relative flex items-center justify-center'>
              <IconButton
                icon={BsCart3}
                size={20}
                onClick={openCartModal}
                aria-label='مشاهده سبد خرید'
              />

              {cartCount > 0 && (
                <span className='pointer-events-none absolute -left-1 -top-1.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 pt-0.5 font-faNa text-[9px] font-bold leading-none text-white'>
                  {cartCount.toLocaleString('fa-IR')}
                </span>
              )}
            </div>

            <NavbarMobileMenu
              isDark={isDark}
              handelDarkMode={toggleTheme}
              user={user}
              signOutModal={setShowSignOutModal}
            />
          </div>
        </div>
      </header>

      {/* فاصله برای Header fixed */}
      <div aria-hidden='true' className='h-16 sm:h-20 lg:h-24' />

      {/* =====================
          Modals
          ===================== */}

      {isShowProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          setShowSignOutModal={setShowSignOutModal}
          user={user}
        />
      )}

      {isShowCartModal && (
        <CartModal onClose={() => setIsShowCartModal(false)} />
      )}

      {showSignOutModal && (
        <Modal
          title='از حساب کاربری خارج می‌شوید؟'
          desc='با خروج از حساب کاربری به دوره‌های تهیه‌شده دسترسی نخواهید داشت.'
          icon={LuLogOut}
          iconSize={36}
          primaryButtonClick={signOutHandler}
          secondaryButtonClick={() => setShowSignOutModal(false)}
          primaryButtonText='خروج از حساب'
          secondaryButtonText='لغو'
        />
      )}
    </>
  );
}
