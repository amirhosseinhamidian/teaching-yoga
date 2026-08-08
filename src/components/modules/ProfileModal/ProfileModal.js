/* eslint-disable react/prop-types */
'use client';

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import {
  HiOutlineAcademicCap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineQuestionMarkCircle,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const ProfileModal = ({ onClose, setShowSignOutModal, user }) => {
  const signOutModalHandler = () => {
    setShowSignOutModal(true);
    onClose();
  };

  const fullName =
    user?.firstname && user?.lastname
      ? `${user.firstname} ${user.lastname}`
      : user?.username || 'کاربر سمانه یوگا';

  const menuItems = [
    {
      href: '/profile?active=0',
      title: 'دوره‌های من',
      description: 'مشاهده مسیرهای آموزشی',
      icon: HiOutlineAcademicCap,
    },
    {
      href: '/profile?active=1',
      title: 'سفارشات',
      description: 'پیگیری خریدهای فروشگاه',
      icon: HiOutlineTruck,
    },
    {
      href: '/profile?active=2',
      title: 'سوالات',
      description: 'سوالات و پاسخ‌های آموزشی',
      icon: HiOutlineQuestionMarkCircle,
    },
    {
      href: '/profile?active=4',
      title: 'تیکت‌ها',
      description: 'پیگیری گفتگوهای پشتیبانی',
      icon: HiOutlineChatBubbleLeftRight,
    },
    {
      href: '/profile?active=5',
      title: 'ویرایش پروفایل',
      description: 'مدیریت اطلاعات حساب',
      icon: HiOutlineUser,
    },
  ];

  return (
    <div
      className='fixed inset-0 z-50 bg-black/45 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        dir='rtl'
        role='dialog'
        aria-modal='true'
        aria-label='منوی پروفایل'
        onClick={(event) => event.stopPropagation()}
        className='absolute left-4 top-[68px] w-[calc(100%-2rem)] max-w-[350px] overflow-hidden rounded-[26px] border border-white/30 bg-surface-light/95 shadow-[0_28px_80px_rgba(15,23,42,0.24)] backdrop-blur-2xl xs:left-6 sm:left-10 dark:border-white/10 dark:bg-surface-dark/95 dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]'
      >
        {/* Glow */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-secondary/10 blur-[70px]'
        />

        <div
          aria-hidden='true'
          className='bg-yellow/10 pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full blur-[70px]'
        />

        <div className='relative z-10'>
          {/* User */}
          <div className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='relative h-14 w-14 shrink-0 overflow-hidden rounded-[18px] border-2 border-surface-light bg-background-light shadow-md dark:border-surface-dark dark:bg-background-dark'>
                <Image
                  src={user?.avatar || '/images/default-profile.png'}
                  alt={fullName}
                  fill
                  sizes='56px'
                  className='object-cover'
                />
              </div>

              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='truncate text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                    {fullName}
                  </h3>

                  {user?.role === 'ADMIN' && (
                    <SiteBadge variant='secondary' size='sm'>
                      مدیر
                    </SiteBadge>
                  )}
                </div>

                <p className='mt-1 truncate text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                  حساب کاربری سمانه یوگا
                </p>
              </div>

              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                <HiOutlineSparkles size={18} />
              </span>
            </div>
          </div>

          <div className='mx-4 h-px bg-black/5 dark:bg-white/10' />

          {/* Menu */}
          <div className='p-2'>
            {user?.role === 'ADMIN' && (
              <Link
                href='/a-panel'
                onClick={onClose}
                className='group mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 hover:bg-secondary/5'
              >
                <span className='bg-yellow/10 text-yellow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105'>
                  <HiOutlineShieldCheck size={20} />
                </span>

                <span className='min-w-0'>
                  <strong className='block text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                    پنل مدیریت
                  </strong>

                  <span className='mt-0.5 block text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    مدیریت وب‌سایت
                  </span>
                </span>
              </Link>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  scroll={false}
                  className='group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 hover:bg-secondary/5'
                >
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-all duration-200 group-hover:scale-105 group-hover:bg-secondary group-hover:text-white'>
                    <Icon size={20} />
                  </span>

                  <span className='min-w-0 flex-1'>
                    <strong className='block text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                      {item.title}
                    </strong>

                    <span className='mt-0.5 block text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className='border-t border-black/5 p-2 dark:border-white/10'>
            <button
              type='button'
              onClick={signOutModalHandler}
              className='group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-right transition-all duration-200 hover:bg-red/5'
            >
              <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red transition-transform group-hover:scale-105'>
                <HiOutlineArrowRightOnRectangle size={20} />
              </span>

              <span>
                <strong className='block text-xs font-black text-red sm:text-sm'>
                  خروج از حساب
                </strong>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
