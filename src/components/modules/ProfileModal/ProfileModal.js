/* eslint-disable react/prop-types */
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GrHomeRounded } from 'react-icons/gr';
import { CgFolder } from 'react-icons/cg';
import { IoChatbubblesOutline } from 'react-icons/io5';
import { IoPersonOutline } from 'react-icons/io5';
import { LuLogOut } from 'react-icons/lu';
import { useAuth } from '@/contexts/AuthContext';

const ProfileModal = ({ onClose, setShowSignOutModal }) => {
  const { user } = useAuth();

  const signOutModalHandler = () => {
    setShowSignOutModal(true);
    onClose();
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div className='absolute left-14 top-14 w-72 rounded-xl bg-surface-light dark:bg-background-dark'>
        <div className='m-4 flex items-center gap-3 border-b border-subtext-light dark:border-subtext-dark'>
          <Image
            src={'/images/default-profile.png'}
            alt='profile'
            width={50}
            height={50}
            className='mb-4 rounded-full'
          />
          <h4 className='text-lg'>{user.username}</h4>
        </div>
        <Link
          href='/'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <GrHomeRounded className='text-xl' />
          پیشخوان
        </Link>

        <Link
          href='/'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <CgFolder className='text-xl' />
          دوره های من
        </Link>

        <Link
          href='/'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <IoChatbubblesOutline className='text-xl' />
          تیکت ها
        </Link>

        <Link
          href='/'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <IoPersonOutline className='text-xl' />
          جزییات حساب
        </Link>

        <div
          onClick={signOutModalHandler}
          className='flex w-full items-center gap-2 rounded-b-xl px-4 pb-6 pt-4 text-red transition-all duration-200 ease-in hover:bg-background-light md:cursor-pointer dark:hover:bg-surface-dark'
        >
          <LuLogOut className='text-xl' />
          خروج از حساب
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
