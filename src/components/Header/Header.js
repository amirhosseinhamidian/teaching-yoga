/* eslint-disable react/prop-types */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Logo from '../Logo/Logo';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import {
  MdOutlineLightMode,
  MdOutlinePerson,
  MdOutlineDarkMode,
} from 'react-icons/md';
import { BsCart3 } from 'react-icons/bs';
import Button from '../Ui/Button/Button';
import NavbarMobileMenu from './NavbarMobileMenu';
import NavbarRoutes from './NavRoutes';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import ProfileModal from '../modules/ProfileModal/ProfileModal';
import Modal from '../modules/Modal/Modal';
import { LuLogOut } from 'react-icons/lu';
import CartModal from '../modules/CartModal/CartModal';
import { PiClockCountdownBold, PiCrownSimple } from 'react-icons/pi';

import { useRouter, usePathname } from 'next/navigation';

// Redux
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';
import { useCart } from '@/hooks/cart/useCart';
import { useShopCart } from '@/hooks/shopCart/useShopCart';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const { isDark, toggleTheme } = useTheme();

  // Redux user
  const { user } = useAuthUser();
  const { logout } = useUserActions();

  // Redux carts
  const { items: courseItems } = useCart();
  const { items: shopItems } = useShopCart();

  const courseCount = Array.isArray(courseItems) ? courseItems.length : 0;
  const shopCount = useMemo(() => {
    if (!Array.isArray(shopItems)) return 0;
    // تعداد آیتم‌های فروشگاه (بر اساس qty) — اگر میخوای فقط تعداد ردیف‌ها باشد، این reduce را حذف کن و .length بگذار
    return shopItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  }, [shopItems]);

  const cartCount = courseCount + shopCount;

  const [isShowProfileModal, setShowProfileModal] = useState(false);
  const [isShowCartModal, setIsShowCartModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const [subscriptionInfo, setSubscriptionInfo] = useState({
    loading: false,
    hasActiveSubscription: false,
    remainingDays: 0,
    planName: null,
  });

  useEffect(() => {
    if (!user) {
      setSubscriptionInfo({
        loading: false,
        hasActiveSubscription: false,
        remainingDays: 0,
        planName: null,
      });
      return;
    }

    let ignore = false;

    const fetchSubscriptionStatus = async () => {
      try {
        setSubscriptionInfo((prev) => ({ ...prev, loading: true }));

        const res = await fetch('/api/subscription/status', { method: 'GET' });
        if (!res.ok) throw new Error('Failed to fetch subscription status');

        const data = await res.json();

        if (!ignore) {
          setSubscriptionInfo({
            loading: false,
            hasActiveSubscription: !!data.hasActiveSubscription,
            remainingDays: data.remainingDays || 0,
            planName: data.planName || null,
          });
        }
      } catch (error) {
        console.error('[SUBSCRIPTION_STATUS_ERROR]', error);
        if (!ignore) {
          setSubscriptionInfo((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchSubscriptionStatus();
    return () => {
      ignore = true;
    };
  }, [user]);

  const signOutHandler = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      logout();
      setShowSignOutModal(false);
      router.refresh();
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  const loginClickHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  return (
    <header className='h-20 bg-surface-light dark:bg-surface-dark'>
      <div className='container flex h-full items-center'>
        <div className='flex w-full items-end'>
          <Link href={'/'}>
            <Logo />
          </Link>
          <nav className='mr-8 hidden gap-3 pb-1 md:flex'>
            <NavbarRoutes />
          </nav>
        </div>

        {/* Desktop */}
        <div className='hidden items-center gap-2 md:flex'>
          {/* Subscription status */}
          {user && (
            <>
              {subscriptionInfo.loading ? (
                <IconButton loading></IconButton>
              ) : subscriptionInfo.hasActiveSubscription ? (
                (() => {
                  const isExpiringSoon = subscriptionInfo.remainingDays <= 7;

                  return (
                    <button
                      type='button'
                      onClick={() => router.push('/subscriptions')}
                      className={`hidden flex-nowrap items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 font-faNa text-xs transition duration-300 ease-in md:flex ${
                        isExpiringSoon
                          ? 'bg-red bg-opacity-15 text-red hover:bg-opacity-100 hover:text-white'
                          : 'hover:bg-green-light bg-emerald-100 text-emerald-700 hover:text-white'
                      } `}
                    >
                      <PiClockCountdownBold size={22} />
                      <span className='text-xs font-bold'>
                        اشتراک:{' '}
                        <span className='text-sm'>
                          {subscriptionInfo.remainingDays}
                        </span>{' '}
                        روز
                      </span>
                    </button>
                  );
                })()
              ) : (
                <button
                  onClick={() => router.push('/subscriptions')}
                  className='hidden flex-nowrap items-center gap-1 whitespace-nowrap rounded-xl bg-background-light p-2 text-xs text-secondary transition duration-300 ease-in hover:bg-secondary hover:text-background-light sm:px-2 md:flex dark:bg-background-dark hover:dark:text-background-dark'
                >
                  <PiCrownSimple size={24} />
                  <span className='font-semibold'>مشترک شوید</span>
                </button>
              )}
            </>
          )}

          <IconButton
            icon={isDark ? MdOutlineLightMode : MdOutlineDarkMode}
            onClick={toggleTheme}
          />

          {/* Cart Button */}
          <div className='relative' onClick={() => setIsShowCartModal(true)}>
            <IconButton icon={BsCart3} />

            {cartCount > 0 && (
              <div className='absolute -right-1 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1 pt-1'>
                <span className='font-faNa text-xs text-white'>
                  {cartCount.toLocaleString('fa-IR')}
                </span>
              </div>
            )}
          </div>

          {/* Profile / Login */}
          {user ? (
            <IconButton
              icon={MdOutlinePerson}
              onClick={() => setShowProfileModal(true)}
            />
          ) : (
            <Button
              className='whitespace-nowrap text-sm'
              onClick={loginClickHandler}
            >
              ثبت نام | ورود
            </Button>
          )}
        </div>

        {/* Mobile */}
        <div className='flex items-center gap-2 md:hidden'>
          <div className='relative' onClick={() => setIsShowCartModal(true)}>
            <IconButton icon={BsCart3} size={20} />

            {cartCount > 0 && (
              <div className='absolute -right-1 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 pt-1'>
                <span className='font-faNa text-xs text-white'>
                  {cartCount.toLocaleString('fa-IR')}
                </span>
              </div>
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

      {/* Profile Modal */}
      {isShowProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          setShowSignOutModal={setShowSignOutModal}
          user={user}
        />
      )}

      {/* Cart Modal */}
      {isShowCartModal && (
        <CartModal onClose={() => setIsShowCartModal(false)} />
      )}

      {/* Logout Modal */}
      {showSignOutModal && (
        <Modal
          title='از حساب کاربری خارج می شوید؟'
          desc='با خروج از حساب کاربری به دوره های تهیه شده دسترسی نخواهید داشت.'
          icon={LuLogOut}
          iconSize={36}
          primaryButtonClick={signOutHandler}
          secondaryButtonClick={() => setShowSignOutModal(false)}
          primaryButtonText='خروج از حساب'
          secondaryButtonText='لغو'
        />
      )}
    </header>
  );
}
