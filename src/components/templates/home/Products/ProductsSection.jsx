/* eslint-disable no-undef */
import { headers } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import ProductsSwiperSection from './ProductsSwiperSection';

const fetchParentCategories = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/parent-categories`,
    {
      method: 'GET',
      headers: headers(),
      next: { revalidate: 7200 },
    }
  );
  if (!res.ok) throw new Error('Failed to fetch parent categories');
  return res.json();
};

const fetchLastTenProducts = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/shop/products/last-ten`,
    {
      method: 'GET',
      headers: headers(),
      next: { revalidate: 1800 },
    }
  );
  if (!res.ok) throw new Error('Failed to fetch last ten products');
  return res.json();
};

async function ProductsSection() {
  const [catsRes, productsRes] = await Promise.all([
    fetchParentCategories(),
    fetchLastTenProducts(),
  ]);

  const categories = catsRes?.data ?? [];
  const products = productsRes?.data ?? [];

  return (
    <div className='relative'>
      <div className='relative mb-8 mt-12 -skew-y-6 transform bg-surface-light sm:mb-16 sm:mt-24 dark:bg-surface-dark'>
        {/* موج بالا */}

        <div className='absolute -bottom-14 -z-50 w-full skew-y-[6]'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='100%'
            height='120'
            viewBox='0 0 2365.67 205.493'
            preserveAspectRatio='none'
          >
            <defs>
              <filter
                id='wave-shadow-bottom-products'
                x='-50%'
                y='-50%'
                width='200%'
                height='200%'
              >
                <feDropShadow
                  dx='-12'
                  dy='0'
                  stdDeviation='16'
                  floodColor='rgba(100, 244, 171, 0.6)'
                />
              </filter>
            </defs>
            <path
              d='M0,211.9s131.514-66.5,394.19-68.626,239.4,32.05,535.326,0,363.031-2.126,562.229,0,358.107-67.378,576.45-4.991c82.534,23.582,251.476,56.627,297.475,31.219-2.337-182.333,0-163.1,0-163.1H0Z'
              transform='translate(0 -20)'
              fill='currentColor'
              className='text-surface-light dark:text-surface-dark'
              filter='url(#wave-shadow-bottom-products)'
            />
          </svg>
        </div>

        <Image
          src='/images/yoga.png'
          alt='Symbol Left'
          className='absolute bottom-6 left-4 hidden w-14 -translate-y-1/2 -rotate-12 animate-pulse opacity-20 xs:block xs:w-16 sm:-bottom-2 sm:left-10 sm:w-24 md:w-28 lg:w-32 xl:w-36'
          width={800}
          height={800}
        />
        <Image
          src='/images/yoga.png'
          alt='Symbol Right'
          className='absolute right-4 top-4 w-14 translate-y-1/2 rotate-12 animate-pulse opacity-20 xs:w-16 sm:-top-2 sm:right-10 sm:w-24 md:w-28 lg:w-32 xl:w-36'
          width={800}
          height={800}
        />

        <div className='flex skew-y-6 flex-col items-center justify-center gap-8 py-12 md:gap-12 md:py-16'>
          <h2 className='text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl'>
            محصولات
          </h2>

          <div className='container my-5 sm:my-7 xl:px-32'>
            <ProductsSwiperSection
              categories={categories}
              products={products}
            />
          </div>

          <Link
            href='/shop/products'
            className='rounded-full border border-subtext-light bg-transparent px-6 py-3 font-medium text-subtext-light transition-all duration-200 ease-in hover:border-transparent hover:bg-accent hover:text-text-light dark:border-subtext-dark dark:text-subtext-dark'
          >
            دیدن همه محصولات
          </Link>
        </div>

        {/* موج پایین */}
        <div className='absolute -top-20 left-0 right-0 skew-y-[6]'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='100%'
            height='120'
            viewBox='0 0 1440 120'
            preserveAspectRatio='none'
          >
            <defs>
              <filter
                id='wave-shadow-products'
                x='-50%'
                y='-50%'
                width='200%'
                height='200%'
              >
                <feDropShadow
                  dx='0'
                  dy='8'
                  stdDeviation='12'
                  floodColor='rgba(100, 244, 171, 0.8)'
                />
              </filter>
            </defs>
            <path
              d='M-27.061,842.561s131.514,66.5,394.19,68.626,239.4-32.05,535.326,0,363.031,2.126,562.229,0,358.107,67.378,576.45,4.991c82.534-23.582,251.476-25.408,297.475,0-2.337,182.333,0,131.876,0,131.876H-27.061Z'
              transform='translate(27.061 -842.561)'
              fill='currentColor'
              className='text-surface-light dark:text-surface-dark'
              filter='url(#wave-shadow-products)'
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default ProductsSection;
