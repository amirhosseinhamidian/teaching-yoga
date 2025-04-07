'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { usePathname } from 'next/navigation'; // هوک برای گرفتن مسیر فعلی
import { RxDashboard } from 'react-icons/rx';
import { TbSchool, TbRosetteDiscount, TbSettings, TbSeo } from 'react-icons/tb';
import { PiUsersBold } from 'react-icons/pi';
import { GrBlog } from 'react-icons/gr';
import { BsCart } from 'react-icons/bs';
import { FaRegComments, FaRegCircleQuestion } from 'react-icons/fa6';
import { IoIosArrowBack } from 'react-icons/io';
import { IoMicOutline } from 'react-icons/io5';
import {
  MdOutlinePlayLesson,
  MdMailOutline,
  MdVideoSettings,
} from 'react-icons/md';

import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';

function NavRoutes({ onLinkClick }) {
  const { notifications } = useNotifications();
  const pathname = usePathname(); // گرفتن مسیر فعلی
  const [openSubMenu, setOpenSubMenu] = useState(null);

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
      href: '/a-panel/podcast',
      label: 'مدیریت پادکست',
      icon: IoMicOutline,
      statusNumber: 0,
    },
    {
      href: '/a-panel/discount-code',
      label: 'مدیریت کدهای تخفیف',
      icon: TbRosetteDiscount,
      statusNumber: 0,
    },
    {
      href: '/a-panel/site-setting',
      label: 'تنظیمات سایت',
      icon: TbSettings,
      statusNumber: 0,
    },
    {
      href: '/a-panel/seo',
      label: 'سئو',
      icon: TbSeo,
      statusNumber: 0,
      subRoutes: [
        { href: '/a-panel/seo/general', label: 'تنظیمات کلی' },
        { href: '/a-panel/seo/internal', label: 'صفحات داخلی' },
        { href: '/a-panel/seo/sitemap', label: 'سایت مپ' },
      ],
    },
  ];

  useEffect(() => {
    navRoutes.forEach((route) => {
      if (route.subRoutes) {
        route.subRoutes.forEach((subRoute) => {
          if (pathname.startsWith(subRoute.href)) {
            setOpenSubMenu(route.label); // باز کردن زیرمنو برای روت با ساب‌روت
          }
        });
      }
    });
  }, []);

  const handleRouteClick = (route) => {
    if (route.subRoutes) {
      setOpenSubMenu((prev) => (prev === route.label ? null : route.label)); // باز یا بسته کردن زیرمنو
    } else {
      setOpenSubMenu(null); // بستن تمام زیرمنوها هنگام رفتن به لینک بدون زیرمنو
      onLinkClick && onLinkClick();
    }
  };

  const isActive = (route) => {
    // حذف "/a-panel" از مسیر
    const trimmedPathname = pathname.replace('/a-panel', '');
    const trimmedRoute = route.href.replace('/a-panel', '');

    if (route.href === '/a-panel') {
      return pathname === '/a-panel'; // فقط اگر مسیر دقیقاً داشبورد باشد
    }

    // بررسی اکتیو بودن فقط بر اساس بخش باقی‌مانده از مسیر
    return trimmedPathname.startsWith(trimmedRoute);
  };

  const isSubRouteActive = (subroute) => {
    // استخراج قسمت پایانی مسیر
    const lastSegmentPathname = pathname.split('/').pop();
    const lastSegmentSubroute = subroute.split('/').pop();

    // مقایسه با ساب‌روت
    return lastSegmentPathname === lastSegmentSubroute;
  };

  return (
    <nav className='px-2 py-6'>
      {navRoutes.map((route) => {
        return (
          <div
            key={route.href}
            className={`mt-1 rounded-lg transition-all duration-150 ease-in ${
              isActive(route)
                ? 'bg-background-light text-secondary dark:bg-background-dark'
                : 'hover:bg-background-light hover:dark:bg-background-dark'
            }`}
          >
            <div
              className={`flex cursor-pointer items-center justify-between gap-1 px-3 py-1 sm:gap-2`}
              onClick={() => handleRouteClick(route)}
            >
              <div className='flex items-center gap-1'>
                <route.icon
                  className={`text-xl sm:text-2xl ${
                    isActive(route)
                      ? 'text-secondary'
                      : 'text-text-light dark:text-text-dark'
                  }`}
                />
                <Link href={route.subRoutes ? '#' : route.href}>
                  <h4
                    className={`text-sm font-medium sm:text-base ${
                      isActive(route) ? 'font-bold' : ''
                    }`.trim()}
                  >
                    {route.label}
                  </h4>
                </Link>
              </div>
              {route.subRoutes && (
                <IoIosArrowBack
                  className={`transition-transform duration-200 ${openSubMenu === route.label ? '-rotate-90' : ''}`}
                />
              )}
            </div>
            {route.subRoutes && openSubMenu === route.label && (
              <div className='ml-2 mr-6 mt-1 space-y-1 pb-2'>
                {route.subRoutes.map((subRoute) => (
                  <Link
                    key={subRoute.href}
                    href={subRoute.href}
                    onClick={() => onLinkClick && onLinkClick()}
                    className={`block rounded-lg px-3 py-1 text-sm transition-all duration-150 ease-in ${
                      isSubRouteActive(subRoute.href)
                        ? 'bg-foreground-light text-secondary dark:bg-foreground-dark'
                        : 'text-text-light hover:bg-foreground-light dark:text-text-dark hover:dark:bg-foreground-dark'
                    }`}
                  >
                    {subRoute.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

NavRoutes.propTypes = {
  onLinkClick: PropTypes.func,
};

export default NavRoutes;
