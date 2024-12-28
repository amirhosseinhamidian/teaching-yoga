/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CourseItem from './CourseItem';
import { useAuth } from '@/contexts/AuthContext';

async function removeCourseFromCart(courseId) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/cart`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error:', errorData.message);
      return;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing course from cart:', error);
  }
}

const CourseItemsCard = ({ data, className }) => {
  const { setUser } = useAuth();
  const [cartData, setCartData] = useState(data);
  const handleDeleteItem = async (courseId) => {
    // حذف دوره از سرور
    const res = await removeCourseFromCart(courseId);
    if (res?.success) {
      // بررسی موفقیت درخواست

      // به‌روزرسانی `cartData` محلی
      setCartData((prev) => ({
        ...prev,
        courses: prev.courses.filter((course) => course.courseId !== courseId),
      }));

      // به‌روزرسانی داده‌های `user`
      setUser((prevUser) => {
        if (!prevUser) return prevUser;

        const updatedCarts = prevUser.carts.map((cart) => {
          // فقط سبد خرید با وضعیت PENDING به‌روزرسانی شود
          if (cart.status === 'PENDING') {
            const updatedCartTerms = cart.cartTerms.filter(
              (cartTerm) =>
                cartTerm.term.courseTerms[0]?.course.id !== courseId,
            );

            const updatedUniqueCourses = cart.uniqueCourses.filter(
              (course) => course.id !== courseId,
            );

            return {
              ...cart,
              cartTerms: updatedCartTerms,
              uniqueCourses: updatedUniqueCourses,
            };
          }
          return cart;
        });

        return {
          ...prevUser,
          carts: updatedCarts,
        };
      });
    } else {
      console.error('Failed to remove course from cart:', res?.message);
    }
  };
  return (
    <div
      className={`rounded-xl bg-surface-light shadow dark:bg-surface-dark ${className}`}
    >
      {cartData.courses.map((course, index) => (
        <div key={course.courseId}>
          <CourseItem
            data={course}
            onDeleteItem={(courseId) => handleDeleteItem(courseId)}
          />
          {index < cartData.courses.length - 1 && (
            <hr className='mx-8 my-2 border-t border-gray-300 dark:border-gray-700' />
          )}
        </div>
      ))}
    </div>
  );
};

CourseItemsCard.propTypes = {
  data: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default CourseItemsCard;
