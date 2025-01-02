/* eslint-disable react/prop-types */
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TbMessageCircleQuestion } from 'react-icons/tb';
import { CgFolder } from 'react-icons/cg';
import { IoChatbubblesOutline } from 'react-icons/io5';
import { IoPersonOutline } from 'react-icons/io5';
import { LuLogOut } from 'react-icons/lu';
import { MdOutlineAdminPanelSettings } from 'react-icons/md';

const ProfileModal = ({ onClose, setShowSignOutModal, user }) => {
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
        <div className='m-4 flex items-center gap-3'>
          <Image
            src={user.avatar || '/images/default-profile.png'}
            alt='profile'
            width={50}
            height={50}
            className='mb-4 rounded-full'
          />
          <h4 className='text-lg'>{user.username}</h4>
        </div>
        <div className='mx-4 border-b'></div>
        {user.role === 'ADMIN' && (
          <Link
            href='/a-panel'
            className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
          >
            <MdOutlineAdminPanelSettings className='text-2xl' />
            پنل ادمین
          </Link>
        )}

        <Link
          href='/profile?active=0'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <CgFolder className='text-xl' />
          دوره های من
        </Link>

        <Link
          href='/profile?active=1'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <TbMessageCircleQuestion className='text-xl' />
          سوالات
        </Link>

        <Link
          href='/profile?active=3'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <IoChatbubblesOutline className='text-xl' />
          تیکت ها
        </Link>

        <Link
          href='/profile?active=4'
          className='flex w-full items-center gap-2 px-4 py-4 transition-all duration-200 ease-in hover:bg-background-light dark:hover:bg-surface-dark'
        >
          <IoPersonOutline className='text-xl' />
          ویرایش
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
