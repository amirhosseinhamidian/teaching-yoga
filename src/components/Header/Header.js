import React from 'react';
import Logo from '../Logo/Logo';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineDarkMode } from "react-icons/md";
import { BsCart3 } from "react-icons/bs";
import Button from '../Ui/Button/Button';
import NavbarMobileMenu from './NavbarMobileMenu';
import NavbarRoutes from './NavRoutes';

export default function Header() {
  return (
    <header className='h-20 bg-surface-light'>
      <div className='container h-full flex items-center'>
        <div className='w-full flex items-end'>
          <Logo />
          <nav className='hidden gap-3 mr-8 pb-1 md:flex'>
            <NavbarRoutes />
          </nav>
        </div>
        <div className='hidden md:flex items-center gap-2'>
            <IconButton icon={MdOutlineDarkMode}/>
            <IconButton icon={BsCart3}/>
            <Button className='whitespace-nowrap text-sm'>ثبت نام | ورود</Button>
        </div>
        <div className='md:hidden'>
            <NavbarMobileMenu />
        </div>
      </div>
    </header>
  );
}
