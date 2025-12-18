/* eslint-disable react/prop-types */
'use client';

import React, { useState, useEffect } from 'react';
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

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const { isDark, toggleTheme } = useTheme();

  // Redux user
  const { user } = useAuthUser();
  const { logout } = useUserActions();

  // Redux cart (جایگزین useSelector)
  const { items } = useCart();
  const cartCount = items?.length || 0;

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
    // اگر لاگین نیست، نیازی به چک کردن نیست
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

        const res = await fetch('/api/subscription/status', {
          method: 'GET',
        });

        if (!res.ok) {
          throw new Error('Failed to fetch subscription status');
        }

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
  // 🔥 Logout handler
  const signOutHandler = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });

      logout(); // پاک کردن user از Redux
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
                          : 'bg-emerald-100 text-emerald-700 hover:bg-green hover:text-white'
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
              <div className='absolute -right-1 -top-3 flex h-5 w-5 items-center justify-center rounded-full bg-red pt-1'>
                <span className='font-faNa text-xs text-white'>
                  {cartCount}
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
              <div className='absolute -right-1 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red pt-1'>
                <span className='font-faNa text-xs text-white'>
                  {cartCount}
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
