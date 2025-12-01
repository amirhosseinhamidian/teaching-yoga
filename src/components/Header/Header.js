/* eslint-disable react/prop-types */
'use client';

import React, { useState } from 'react';
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
