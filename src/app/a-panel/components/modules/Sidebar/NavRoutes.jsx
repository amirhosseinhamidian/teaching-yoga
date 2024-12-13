import React from 'react';
import { RxDashboard } from 'react-icons/rx';
import { TbSchool, TbRosetteDiscount, TbSettings, TbSeo } from 'react-icons/tb';
import { PiUsersBold } from 'react-icons/pi';
import { GrBlog } from 'react-icons/gr';
import { HiOutlineCloudUpload } from 'react-icons/hi';
import { BsCart } from 'react-icons/bs';
import { FaRegComments, FaRegCircleQuestion } from 'react-icons/fa6';
import Link from 'next/link';

function NavRoutes() {
  const navRoutes = [
    { href: '/a-panel', label: 'داشبورد', icon: RxDashboard },
    { href: '/a-panel/course', label: 'مدیریت دوره ها', icon: TbSchool },
    { href: '/a-panel/user', label: 'مدیریت کاربران', icon: PiUsersBold },
    { href: '/a-panel/blog', label: 'مدیریت بلاگ', icon: GrBlog },
    {
      href: '/a-panel/media',
      label: 'مدیریت رسانه و آپلود',
      icon: HiOutlineCloudUpload,
    },
    { href: '/a-panel/orders', label: 'سفارشات و فروش', icon: BsCart },
    {
      href: '/a-panel/comments',
      label: 'مدیریت کامنت ها',
      icon: FaRegComments,
    },
    {
      href: '/a-panel/tickets',
      label: 'تیکت ها و سوالات',
      icon: FaRegCircleQuestion,
    },
    {
      href: '/a-panel/discounts',
      label: 'مدیریت کدهای تخفیف',
      icon: TbRosetteDiscount,
    },
    { href: '/a-panel/settings', label: 'تنظیمات سایت', icon: TbSettings },
    { href: '/a-panel/seo', label: 'سئو', icon: TbSeo },
  ];
  return (
    <nav className='px-2 py-6'>
      {navRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className='flex items-center gap-1 rounded-lg px-3 py-2 transition-all duration-150 ease-in hover:bg-background-light sm:gap-2 hover:dark:bg-background-dark'
        >
          <route.icon className='text-xl text-text-light sm:text-2xl dark:text-text-dark' />
          <h4 className='text-sm font-medium sm:text-base'>{route.label}</h4>
        </Link>
      ))}
    </nav>
  );
}

export default NavRoutes;
