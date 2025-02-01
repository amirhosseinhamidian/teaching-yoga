/* eslint-disable react/prop-types */
'use client';
import React, { useState } from 'react';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { HiMenu } from 'react-icons/hi';
import { createPortal } from 'react-dom';
import Logo from '../Logo/Logo';
import { IoCloseOutline } from 'react-icons/io5';
import Button from '../Ui/Button/Button';
import NavbarRoutes from './NavRoutes';
import Switch from '../Ui/Switch/Switch';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MdOutlineAdminPanelSettings } from 'react-icons/md';
import { LuLogOut } from 'react-icons/lu';

export default function NavbarMobileMenu({
  isDark,
  handelDarkMode,
  isLogin,
  user,
  signOutModal,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => setIsVisible(false), 300); // 300ms for transition duration
    } else {
      setIsVisible(true);
      setTimeout(() => setIsOpen(true), 10); // Small delay to allow portal to mount
    }
  };
  const loginClickHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  const handleSignOutModal = () => {
    signOutModal(true);
    setIsOpen(false);
  };

  return (
    <div>
      <IconButton
        icon={HiMenu}
        size={20}
        onClick={(e) => {
          e.preventDefault();
          toggleOpen();
        }}
      />
      {isVisible &&
        createPortal(
          <>
            {/* Background overlay */}
            <div
              className='fixed inset-0 bg-black opacity-50'
              onClick={() => toggleOpen()}
            ></div>

            {/* Mobile Menu */}
            <div
              className={`fixed right-0 top-0 flex h-full w-60 transform flex-col justify-between gap-y-4 bg-surface-light p-5 transition-transform duration-300 ease-in-out dark:bg-surface-dark ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <div className='flex flex-col gap-y-4'>
                <div className='flex items-center justify-between'>
                  <Logo size='small' />
                  <IoCloseOutline
                    className='text-2xl text-text-light dark:text-text-dark'
                    onClick={() => toggleOpen()}
                  />
                </div>

                {isLogin ? (
                  <div>
                    <Link href='/profile' onClick={toggleOpen}>
                      <div className='m-2 flex items-center gap-3'>
                        <Image
                          src={
                            user.avatar
                              ? user.avatar
                              : '/images/default-profile.png'
                          }
                          alt='profile'
                          width={50}
                          height={50}
                          className='rounded-full'
                        />
                        <div>
                          <h4 className='text-base'>{user.username}</h4>
                          <h4 className='text-sm'>مشاهده پروفایل</h4>
                        </div>
                      </div>
                    </Link>
                    {user.userRole !== 'Admin' && (
                      <Link
                        href='/a-panel'
                        className='mx-auto mt-6 flex items-center gap-2 rounded-full border border-text-light p-2 transition-all duration-200 ease-in hover:bg-background-light dark:border-text-dark dark:hover:bg-background-dark'
                      >
                        <MdOutlineAdminPanelSettings className='text-2xl' />
                        پنل ادمین
                      </Link>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={loginClickHandler}
                    className='w-full whitespace-nowrap text-sm'
                  >
                    ثبت نام | ورود
                  </Button>
                )}
                <div className='border-b'></div>
                <div className='flex'>
                  <NavbarRoutes vertical toggleOpen={toggleOpen} />
                </div>
                <div className='border-b'></div>
                <Switch
                  label={isDark ? 'حالت تاریک' : 'حالت روشن'}
                  checked={isDark}
                  onChange={handelDarkMode}
                  className='gap-12'
                />
              </div>
              <div
                className='flex gap-2 text-subtext-light dark:text-subtext-dark'
                onClick={handleSignOutModal}
              >
                <LuLogOut size={22} />
                <span className='text-sm'>خروج از حساب</span>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
