'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import IconButton from '@/components/Ui/ButtonIcon/ButtonIcon';
import { TbLayoutSidebarRightExpandFilled } from 'react-icons/tb';
import { HiOutlineUserCircle } from 'react-icons/hi2';
import { useAuth } from '@/contexts/AuthContext';
import NavRoutes from './NavRoutes';
import Image from 'next/image';
import { IoCloseOutline } from 'react-icons/io5';

const MobileSidebar = () => {
  const { user } = useAuth();
  const [openSidebar, setOpenSidebar] = useState(false);
  const toggleSidebar = () => {
    setOpenSidebar(!openSidebar);
  };
  return (
    <div>
      <IconButton
        icon={TbLayoutSidebarRightExpandFilled}
        onClick={toggleSidebar}
        className='block xl:hidden'
      />
      {openSidebar &&
        createPortal(
          <>
            {/* Background overlay */}
            <div
              className='fixed inset-0 bg-black opacity-50'
              onClick={() => toggleSidebar()}
            ></div>
            <aside
              className={`hide-scrollbar fixed right-0 top-0 flex h-full w-56 transform flex-col overflow-y-auto bg-surface-light transition-transform duration-300 ease-in-out sm:w-64 dark:bg-surface-dark ${openSidebar ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-1 p-4 md:p-6'>
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt='profile'
                      width={50}
                      height={50}
                      className='rounded-full'
                    />
                  ) : (
                    <HiOutlineUserCircle className='text-5xl text-subtext-light dark:text-subtext-dark' />
                  )}

                  <div>
                    <h4 className='-mb-2 text-sm md:text-base'>
                      {user.username}
                    </h4>
                    <h4 className='text-2xs text-subtext-light md:text-xs dark:text-subtext-dark'>
                      مدیر سایت
                    </h4>
                  </div>
                </div>
                <IoCloseOutline
                  className='ml-3 text-2xl text-text-light dark:text-text-dark'
                  onClick={() => toggleSidebar()}
                />
              </div>
              <div className='w-full border border-b dark:border-subtext-dark'></div>
              <NavRoutes onLinkClick={toggleSidebar} />
            </aside>
          </>,
          document.body,
        )}
    </div>
  );
};

export default MobileSidebar;
