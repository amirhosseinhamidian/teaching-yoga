/* eslint-disable no-undef */
'use client';
import React from 'react';
import PropTypes from 'prop-types';
import CourseItem from './CourseItem';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/app/actions/updateUser';

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

const CourseItemsCard = ({ data, className, onDeleteItem }) => {
  const { setUser } = useAuth();
  const handleDeleteItem = async (courseId) => {
    const res = await removeCourseFromCart(courseId);
    if (res?.success) {
      await onDeleteItem();
      await updateUser(setUser);
    } else {
      console.error('Failed to remove course from cart:', res?.message);
    }
  };

  return (
    <div
      className={`rounded-xl bg-surface-light shadow dark:bg-surface-dark ${className}`}
    >
      {data?.courses &&
        data.courses.map((course, index) => (
          <div key={course.courseId}>
            <CourseItem
              data={course}
              onDeleteItem={(courseId) => handleDeleteItem(courseId)}
            />
            {index < data.courses.length - 1 && (
              <hr className='mx-8 my-2 border-t border-gray-300 dark:border-gray-600' />
            )}
          </div>
        ))}
    </div>
  );
};

CourseItemsCard.propTypes = {
  data: PropTypes.object.isRequired,
  className: PropTypes.string,
  onDeleteItem: PropTypes.func.isRequired,
};

export default CourseItemsCard;
