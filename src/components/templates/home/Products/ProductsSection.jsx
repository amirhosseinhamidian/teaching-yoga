// src/components/templates/home/Products/ProductsSection.jsx

/* eslint-disable no-undef */

import { headers } from 'next/headers';
import React from 'react';

import ProductsSwiperSection from './ProductsSwiperSection';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SectionHeader from '@/components/SiteUi/SectionHeader/SectionHeader';

import {
  HiOutlineArrowLeft,
  HiOutlineShoppingBag,
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
        <div className='absolute -left-44 bottom-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[140px] dark:bg-primary/5' />
        <div className='absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent' />
        <div className='products-background-grid absolute inset-0 opacity-[0.035] dark:opacity-[0.055]' />
      </div>

      <div className='container mx-auto px-4 sm:px-6'>
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='px-4 py-7 sm:px-7 sm:py-10 lg:px-10 lg:py-12'
        >
          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
          />
          <div
            aria-hidden='true'
            className='absolute -bottom-28 left-[20%] h-64 w-64 rounded-full bg-primary/10 blur-[100px]'
          />

          <SectionHeader
            icon={HiOutlineShoppingBag}
            eyebrow='فروشگاه سامانه یوگا'
            title={
              <span className='block text-3xl font-black leading-[1.6] sm:text-4xl lg:text-5xl'>
                محصولاتی برای یک{' '}
                <span className='text-secondary'>تمرین آگاهانه</span>
              </span>
            }
            description='مجموعه‌ای از محصولات کاربردی و انتخاب‌شده برای یوگا، مدیتیشن و ساختن یک سبک زندگی آرام‌تر و متعادل‌تر.'
            action={
              <SiteButton
                href='/shop/products'
                variant='secondary'
                size='lg'
                startIcon={HiOutlineShoppingBag}
                endIcon={HiOutlineArrowLeft}
                className='hidden lg:inline-flex'
              >
                مشاهده همه محصولات
              </SiteButton>
            }
            className='relative z-10 mb-8 lg:mb-10'
          />

          <div className='relative z-10'>
            <ProductsSwiperSection
              categories={categories}
              products={products}
            />
          </div>

          <div className='relative z-10 mt-8 flex justify-center lg:hidden'>
            <SiteButton
              href='/shop/products'
              variant='primary'
              size='lg'
              startIcon={HiOutlineShoppingBag}
              endIcon={HiOutlineArrowLeft}
              fullWidth
              className='sm:w-auto'
            >
              مشاهده همه محصولات
            </SiteButton>
          </div>
        </SiteCard>
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
