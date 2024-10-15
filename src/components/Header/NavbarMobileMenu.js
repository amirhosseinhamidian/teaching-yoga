'use client';
import React, { useState } from 'react';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { HiMenu } from 'react-icons/hi';
import { createPortal } from 'react-dom';
import Logo from '../Logo/Logo';
import { IoCloseOutline } from 'react-icons/io5';
import Button from '../Ui/Button/Button';
import NavbarRoutes from './NavRoutes';

export default function NavbarMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => setIsVisible(false), 300); // 300ms for transition duration
    } else {
      setIsVisible(true);
      setTimeout(() => setIsOpen(true), 10); // Small delay to allow portal to mount
    }
  };
  return (
    <div>
      <IconButton
        icon={HiMenu}
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
              className={`fixed right-0 top-0 flex h-full w-60 transform flex-col gap-y-4 bg-surface-light p-5 transition-transform duration-300 ease-in-out dark:bg-surface-dark ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <div className='flex items-center justify-between'>
                <Logo />
                <IoCloseOutline
                  className='text-2xl'
                  onClick={() => toggleOpen()}
                />
              </div>
              <Button className='whitespace-nowrap text-sm'>
                ثبت نام | ورود
              </Button>
              <div className='border-b'></div>
              <div className='flex'>
                <NavbarRoutes vertical />
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
