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
import { signOut } from 'next-auth/react';
import { LuLogOut } from 'react-icons/lu';
import Modal from '../modules/Modal/Modal';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import CartModal from '../modules/CartModal/CartModal';

export default function Header({ isLogin }) {
  const { isDark, toggleTheme } = useTheme();
  const [isShowProfileModal, setShowProfileModal] = useState(false);
  const [isShowCartModal, setIsShowCartModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { user, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const signOutHandler = async () => {
    await signOut({ callbackUrl: pathname });
    setUser(null);
    setShowSignOutModal(false);
  };

  const loginClickHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  const getNumberOfCart = () => {
    return user.carts.map((cart) => {
      if (cart.status === 'PENDING') {
        return cart.uniqueCourses.length;
      }
    });
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
        <div className='hidden items-center gap-2 md:flex'>
          <IconButton
            icon={isDark ? MdOutlineLightMode : MdOutlineDarkMode}
            onClick={toggleTheme}
          />
          <div className='relative' onClick={() => setIsShowCartModal(true)}>
            <IconButton icon={BsCart3} />
            <div
              className={`absolute -right-1 -top-3 h-5 w-5 items-center justify-center rounded-full bg-red pt-1 ${getNumberOfCart() === 0 ? 'hidden' : 'flex'}`}
            >
              <span className='font-faNa text-xs text-white sm:text-sm'>
                {getNumberOfCart()}
              </span>
            </div>
          </div>
          {isLogin ? (
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
        <div className='flex items-center gap-2 md:hidden'>
          <div className='relative' onClick={() => setIsShowCartModal(true)}>
            <IconButton icon={BsCart3} size={20} />
            <div
              className={`absolute -right-1 -top-2 h-4 w-4 items-center justify-center rounded-full bg-red pt-1 ${getNumberOfCart() === 0 ? 'hidden' : 'flex'}`}
            >
              <span className='font-faNa text-xs text-white'>
                {getNumberOfCart()}
              </span>
            </div>
          </div>
          <NavbarMobileMenu
            isDark={isDark}
            handelDarkMode={toggleTheme}
            isLogin={isLogin}
            user={user}
          />
        </div>
      </div>
      {isShowProfileModal && (
        <ProfileModal
          onClose={handleCloseProfileModal}
          setShowSignOutModal={setShowSignOutModal}
          user={user}
        />
      )}
      {isShowCartModal && (
        <CartModal onClose={() => setIsShowCartModal(false)} />
      )}
      {showSignOutModal && (
        <Modal
          title='از حساب کاربری خارج می شوید؟'
          desc='با خروج از حساب کاربری به دوره های تهیه شده دسترسی نخواهید داشت. هر وقت بخواهید می توانید مجددا وارد شوید و به دوره هایتان دسترسی خواهید داشت.'
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
