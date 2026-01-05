/* eslint-disable react/prop-types */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const routes = [
  {
    label: 'خانه',
    path: '/',
  },
  {
    label: 'دوره‌ها',
    path: '/courses',
  },
  {
    label: 'فروشگاه',
    path: '/shop/products',
    key: 'shop',
  },
  {
    label: 'مقالات',
    path: '/articles',
  },
  {
    label: 'ارتباط با ما',
    path: '/contact-us',
  },
];

const NavbarRoutes = ({ vertical = false, toggleOpen }) => {
  const { user } = useAuthUser();
  const [shopVisibility, setShopVisibility] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchShopStatus = async () => {
      try {
        const res = await fetch('/api/shop/status', {
          cache: 'no-store',
        });
        const data = await res.json();
        if (mounted && data?.shopVisibility) {
          setShopVisibility(data.shopVisibility);
        }
      } catch (e) {
        console.error('Failed to fetch shop status', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchShopStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const canSeeShop = useMemo(() => {
    if (loading) return false;

    if (shopVisibility === 'OFF') return false;

    if (shopVisibility === 'ADMIN_ONLY') {
      return user?.role === 'ADMIN' || user?.role === 'MANAGER';
    }

    return true; // ALL
  }, [shopVisibility, user, loading]);

  return (
    <div
      className={`flex items-start justify-start gap-3 ${
        vertical ? 'flex-col' : ''
      }`}
    >
      {routes.map(({ label, path, key }) => {
        if (key === 'shop' && !canSeeShop) return null;

        return (
          <Link
            href={path}
            key={label}
            className='text-text-light transition duration-200 ease-in hover:text-secondary dark:text-text-dark'
            onClick={toggleOpen && toggleOpen}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
};

export default NavbarRoutes;
