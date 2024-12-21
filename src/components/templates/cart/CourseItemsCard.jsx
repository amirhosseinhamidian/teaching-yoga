/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CourseItem from './CourseItem';

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
  const [cartData, setCartData] = useState(data);
  const handleDeleteItem = async (courseId) => {
    const res = await removeCourseFromCart(courseId);
    if (res.success) {
      // بررسی موفقیت درخواست
      setCartData((prev) => ({
        ...prev,
        courses: prev.courses.filter((course) => course.courseId !== courseId),
      }));
    }
  };
  return (
    <div
      className={`rounded-xl bg-surface-light dark:bg-surface-dark ${className}`}
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
