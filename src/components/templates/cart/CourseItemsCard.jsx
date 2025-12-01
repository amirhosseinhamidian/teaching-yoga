'use client';

import React from 'react';
import CourseItem from './CourseItem';
import { useCart } from '@/hooks/cart/useCart';
import { useCartActions } from '@/hooks/cart/useCartActions';

// eslint-disable-next-line react/prop-types
export default function CourseItemsCard({ className }) {
  const { items } = useCart();
  const { removeFromCart } = useCartActions();

  const handleDeleteItem = async (courseId) => {
    await removeFromCart(courseId);
  };

  return (
    <div
      className={`rounded-xl bg-surface-light shadow dark:bg-surface-dark ${className}`}
    >
      {items.map((course, index) => (
        <div key={course.courseId}>
          <CourseItem
            data={course}
            onDeleteItem={() => handleDeleteItem(course.courseId)}
          />

          {index < items.length - 1 && (
            <hr className='mx-8 my-2 border-t border-gray-300 dark:border-gray-600' />
          )}
        </div>
      ))}
    </div>
  );
}
