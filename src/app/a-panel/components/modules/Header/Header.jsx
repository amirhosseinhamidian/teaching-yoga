'use client';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';
import React from 'react';
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md';
import { GoBell } from 'react-icons/go';
import { useTheme } from '@/contexts/ThemeContext';
import { BiLogOut } from 'react-icons/bi';
import MobileSidebar from '../Sidebar/MobileSidebar';

function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className='bg-surface-light dark:bg-surface-dark'>
      <div className='flex h-14 w-full items-center justify-between gap-2 px-4 sm:px-6'>
        <MobileSidebar />
        <div className='flex items-center gap-2'>
          <IconButton
            icon={isDark ? MdOutlineLightMode : MdOutlineDarkMode}
            onClick={toggleTheme}
          />
          <div>
            <IconButton icon={GoBell} />
          </div>
          <IconButton icon={BiLogOut} />
        </div>
      </div>
    </header>
  );
}

export default Header;
