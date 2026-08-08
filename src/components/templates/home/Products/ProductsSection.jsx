// src/components/templates/home/Products/ProductsSection.jsx

/* eslint-disable no-undef */

import { headers } from 'next/headers';
import Link from 'next/link';
import React from 'react';
import ProductsSwiperSection from './ProductsSwiperSection';

import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const fetchParentCategories = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/parent-categories`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 7200,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch parent categories');
  }

  return response.json();
};

const fetchLastTenProducts = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/products/last-ten`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 1800,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch last ten products');
  }

  return response.json();
};

async function ProductsSection() {
  const [categoriesResponse, productsResponse] = await Promise.all([
    fetchParentCategories(),
    fetchLastTenProducts(),
  ]);

  const categories = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
    : [];

  const products = Array.isArray(productsResponse?.data)
    ? productsResponse.data
    : [];

  return (
    <section
      dir='rtl'
      className='relative isolate overflow-hidden bg-background-light py-12 transition-colors duration-300 sm:py-16 lg:py-20 dark:bg-background-dark'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-48 top-10 h-[460px] w-[460px] rounded-full bg-secondary/10 blur-[140px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-44 bottom-0 h-[420px] w-[420px] rounded-full blur-[140px]' />

        <div className='absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />

        <div className='products-background-grid absolute inset-0 opacity-[0.035] dark:opacity-[0.055]' />

        <svg
          viewBox='0 0 280 280'
          fill='none'
          className='absolute -right-16 bottom-10 h-72 w-72 text-secondary opacity-[0.035] dark:opacity-[0.06]'
        >
          <circle
            cx='140'
            cy='140'
            r='105'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeDasharray='7 9'
          />

          <circle
            cx='140'
            cy='140'
            r='72'
            stroke='currentColor'
            strokeWidth='1.5'
          />

          <path
            d='M140 42C151 91 176 116 225 127C176 138 151 163 140 212C129 163 104 138 55 127C104 116 129 91 140 42Z'
            stroke='currentColor'
            strokeWidth='1.5'
          />
        </svg>
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <div className='relative overflow-hidden rounded-[30px] border border-black/5 bg-surface-light/75 px-4 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:rounded-[38px] sm:px-7 sm:py-10 lg:px-10 lg:py-12 dark:border-white/10 dark:bg-surface-dark/70 dark:shadow-[0_28px_90px_rgba(0,0,0,0.26)]'>
          <div
            aria-hidden='true'
            className='absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent'
          />

          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/10 absolute -bottom-28 left-[20%] h-64 w-64 rounded-full blur-[100px]'
          />

          <div className='relative z-10 mb-8 flex flex-col gap-7 lg:mb-10 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-2xl'>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary sm:text-sm'>
                <HiOutlineSparkles size={18} />

                <span>فروشگاه سامانه یوگا</span>
              </div>

              <h2 className='text-3xl font-black leading-[1.6] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
                محصولاتی برای یک
                <span className='group relative mx-2 inline-block text-secondary'>
                  تمرین آگاهانه
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 170 18'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-1 right-0 h-3 w-full'
                  >
                    <path
                      d='M4 12C36 4 68 16 101 9C126 4 147 5 166 9'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='4'
                      strokeLinecap='round'
                      opacity='0.75'
                    />
                  </svg>
                </span>
              </h2>

              <p className='mt-4 max-w-xl text-sm leading-8 text-subtext-light sm:text-base dark:text-subtext-dark'>
                مجموعه‌ای از محصولات کاربردی و انتخاب‌شده برای یوگا، مدیتیشن و
                ساختن یک سبک زندگی آرام‌تر و متعادل‌تر.
              </p>
            </div>

            <Link
              href='/shop/products'
              className='group hidden h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border border-secondary/20 bg-secondary/10 px-6 text-sm font-bold text-secondary transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:bg-secondary hover:text-white lg:flex'
            >
              <HiOutlineShoppingBag size={21} />

              <span>مشاهده همه محصولات</span>

              <HiOutlineArrowLeft
                size={19}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>

          <div className='relative z-10'>
            <ProductsSwiperSection
              categories={categories}
              products={products}
            />
          </div>

          <div className='relative z-10 mt-8 flex justify-center lg:hidden'>
            <Link
              href='/shop/products'
              className='h-13 group flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 text-sm font-bold text-white shadow-[0_14px_35px_rgba(38,145,125,0.22)] transition-all duration-300 hover:-translate-y-1 sm:w-auto'
            >
              <HiOutlineShoppingBag size={21} />

              <span>مشاهده همه محصولات</span>

              <HiOutlineArrowLeft
                size={18}
                className='transition-transform duration-300 group-hover:-translate-x-1'
              />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .products-background-grid {
          background-image:
            linear-gradient(
              rgba(100, 244, 171, 0.28) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(100, 244, 171, 0.28) 1px,
              transparent 1px
            );
          background-size: 56px 56px;
          mask-image: linear-gradient(
            to bottom,
            transparent,
            black 20%,
            black 75%,
            transparent
          );
        }
      `}</style>
    </section>
  );
}

export default ProductsSection;
