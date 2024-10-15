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
    path: '/',
  },
  {
    label: 'کلاس آنلاین',
    path: '/',
  },
  {
    label: 'مقالات',
    path: '/',
  },
  {
    label: 'ارتباط با ما',
    path: '/',
  },
];

const NavbarRoutes = ({ vertical = false }) => {
  return (
    <div
      className={`flex items-start justify-start gap-3 ${vertical ? 'flex-col' : ''}`}
    >
      {routes.map(({ label, path }) => (
        <Link
          href={path}
          key={label}
          className='text-text-light dark:text-text-dark transition duration-200 ease-in hover:text-secondary'
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

export default NavbarRoutes;
