'use client';

import React from 'react';

import CourseItem from './CourseItem';

import { useCart } from '@/hooks/cart/useCart';
import { useCartActions } from '@/hooks/cart/useCartActions';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { HiOutlineAcademicCap } from 'react-icons/hi2';

// eslint-disable-next-line react/prop-types
export default function CourseItemsCard({ className }) {
  const { items } = useCart();

  const { removeFromCart } = useCartActions();

  const handleDeleteItem = async (courseId) => {
    await removeFromCart(courseId);
  };

  return (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`overflow-hidden ${className || ''}`}
    >
      {/* Header */}
      <div className='flex items-center justify-between gap-3 border-b border-black/5 px-4 py-4 sm:px-5 dark:border-white/10'>
        <div className='flex items-center gap-3'>
          <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineAcademicCap size={21} />
          </span>

          <div>
            <h2 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              دوره‌های آموزشی
            </h2>

            <p className='mt-0.5 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
              دوره‌های انتخاب‌شده شما
            </p>
          </div>
        </div>

        <SiteBadge variant='secondary' size='sm'>
          {items.length.toLocaleString('fa-IR')} دوره
        </SiteBadge>
      </div>

      {/* Items */}
      <div>
        {items.map((course, index) => (
          <div
            key={course.courseId}
            className={
              index < items.length - 1
                ? 'border-b border-black/5 dark:border-white/10'
                : ''
            }
          >
            <CourseItem
              data={course}
              onDeleteItem={() => handleDeleteItem(course.courseId)}
            />
          </div>
        ))}
      </div>
    </SiteCard>
  );
}
