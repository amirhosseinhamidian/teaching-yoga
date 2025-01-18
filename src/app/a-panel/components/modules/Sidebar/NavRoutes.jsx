'use client';
import React from 'react';
import { usePathname } from 'next/navigation'; // هوک برای گرفتن مسیر فعلی
import { RxDashboard } from 'react-icons/rx';
import { TbSchool, TbRosetteDiscount, TbSettings, TbSeo } from 'react-icons/tb';
import { PiUsersBold } from 'react-icons/pi';
import { GrBlog } from 'react-icons/gr';
import { BsCart } from 'react-icons/bs';
import { FaRegComments, FaRegCircleQuestion } from 'react-icons/fa6';
import {
  MdOutlinePlayLesson,
  MdMailOutline,
  MdVideoSettings,
} from 'react-icons/md';

import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';

function NavRoutes() {
  const { notifications } = useNotifications();
  const pathname = usePathname(); // گرفتن مسیر فعلی

  const navRoutes = [
    { href: '/a-panel', label: 'داشبورد', icon: RxDashboard, statusNumber: 0 },
    {
      href: '/a-panel/course',
      label: 'مدیریت دوره ها',
      icon: TbSchool,
      statusNumber: 0,
    },
    {
      href: '/a-panel/term',
      label: 'مدیریت ترم ها',
      icon: MdOutlinePlayLesson,
      statusNumber: 0,
    },
    {
      href: '/a-panel/session',
      label: 'مدیریت جلسه ها',
      icon: MdVideoSettings,
      statusNumber: 0,
    },
    {
      href: '/a-panel/user',
      label: 'مدیریت کاربران',
      icon: PiUsersBold,
      statusNumber: 0,
    },
    {
      href: '/a-panel/blog',
      label: 'مدیریت بلاگ',
      icon: GrBlog,
      statusNumber: 0,
    },
    {
      href: '/a-panel/sale',
      label: 'سفارشات و فروش',
      icon: BsCart,
      statusNumber: 0,
    },
    {
      href: '/a-panel/comment',
      label: 'مدیریت کامنت ها',
      icon: FaRegComments,
      statusNumber:
        notifications.details[0]?.count + notifications.details[1]?.count,
    },
    {
      href: '/a-panel/tickets',
      label: ' مدیریت تیکت ها',
      icon: MdMailOutline,
      statusNumber:
        notifications.details[2]?.count + notifications.details[3]?.count,
    },
    {
      href: '/a-panel/questions',
      label: ' مدیریت سوال ها',
      icon: FaRegCircleQuestion,
      statusNumber: notifications.details[4]?.count,
    },
    {
      href: '/a-panel/discounts',
      label: 'مدیریت کدهای تخفیف',
      icon: TbRosetteDiscount,
      statusNumber: 0,
    },
    {
      href: '/a-panel/settings',
      label: 'تنظیمات سایت',
      icon: TbSettings,
      statusNumber: 0,
    },
    { href: '/a-panel/seo', label: 'سئو', icon: TbSeo, statusNumber: 0 },
  ];

  return (
    <nav className='px-2 py-6'>
      {navRoutes.map((route) => {
        const isActive = pathname === route.href; // بررسی لینک فعال

        return (
          <Link
            key={route.href}
            href={route.href}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 transition-all duration-150 ease-in sm:gap-2 ${isActive ? 'bg-background-light text-secondary dark:bg-background-dark' : 'hover:bg-background-light hover:dark:bg-background-dark'}`}
          >
            <route.icon
              className={`text-xl sm:text-2xl ${
                isActive
                  ? 'dark:text-primary-dark text-secondary'
                  : 'text-text-light dark:text-text-dark'
              }`}
            />
            <h4
              className={`text-sm font-medium sm:text-base ${isActive ? 'font-bold' : ''}`}
            >
              {route.label}
            </h4>
            {route.statusNumber > 0 && (
              <div className='mr-1 flex h-5 w-5 items-start justify-center rounded-full bg-red sm:mr-2 sm:h-6 sm:w-6'>
                <span className='font-faNa text-xs text-white sm:pt-0.5 sm:text-sm'>
                  {route.statusNumber}
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default NavRoutes;
