'use client';
import React from 'react';
import Image from 'next/image';
import { HiOutlineUserCircle } from 'react-icons/hi2';
import NavRoutes from './NavRoutes';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const Sidebar = () => {
  const { user } = useAuthUser();
  return (
    <aside className='h-full min-h-screen w-64 bg-surface-light dark:bg-surface-dark'>
      <div className='flex items-center gap-1 p-4 md:p-6'>
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt='profile'
            width={50}
            height={50}
            className='h-9 w-9 rounded-full border xs:h-11 xs:w-11 sm:h-14 sm:w-14'
          />
        ) : (
          <HiOutlineUserCircle className='text-5xl text-subtext-light dark:text-subtext-dark' />
        )}

        <div>
          <h4 className='-mb-2 text-sm md:text-base'>{user.username}</h4>
          <h4 className='text-2xs text-subtext-light md:text-xs dark:text-subtext-dark'>
            مدیر سایت
          </h4>
        </div>
      </div>
      <div className='w-56 border border-b md:w-64 dark:border-subtext-dark'></div>
      <NavRoutes />
    </aside>
  );
};

export default Sidebar;
