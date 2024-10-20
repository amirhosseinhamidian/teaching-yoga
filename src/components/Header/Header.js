'use client';
import React from 'react';
import Logo from '../Logo/Logo';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { MdOutlineLightMode } from 'react-icons/md';
import { MdOutlineDarkMode } from 'react-icons/md';
import { BsCart3 } from 'react-icons/bs';
import Button from '../Ui/Button/Button';
import NavbarMobileMenu from './NavbarMobileMenu';
import NavbarRoutes from './NavRoutes';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();

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
          <IconButton icon={BsCart3} />
          <Link href={'/login'}><Button className='whitespace-nowrap text-sm'>ثبت نام | ورود</Button></Link>
        </div>
        <div className='flex items-center gap-2 md:hidden'>
          <IconButton icon={BsCart3} size={20} />
          <NavbarMobileMenu isDark={isDark} handelDarkMode={toggleTheme} />
        </div>
      </div>
    </header>
  );
}
