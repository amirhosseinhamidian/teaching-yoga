/* eslint-disable react/prop-types */
'use client';
import React from 'react';
import Link from 'next/link';

const routes = [
  {
    label: 'خانه',
    path: '/',
  },
  {
    label: 'دوره‌ها',
    path: '/courses',
  },
  // {
  //   label: 'کلاس آنلاین',
  //   path: '/',
  // },
  // {
  //   label: 'مقالات',
  //   path: '/',
  // },
  {
    label: 'ارتباط با ما',
    path: '/contact-us',
  },
];

const NavbarRoutes = ({ vertical = false, toggleOpen }) => {
  return (
    <div
      className={`flex items-start justify-start gap-3 ${vertical ? 'flex-col' : ''}`.trim()}
    >
      {routes.map(({ label, path }) => (
        <Link
          href={path}
          key={label}
          className='text-text-light transition duration-200 ease-in hover:text-secondary dark:text-text-dark'
          onClick={toggleOpen && toggleOpen}
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

export default NavbarRoutes;
