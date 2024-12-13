/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UserCourseRow from './UserCourseRow';

async function fetchCourseProgress(userId) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/courses-progress`,
    {
      cache: 'no-store', // Ensures SSR by disabling caching
      method: 'GET',
      headers: {
        userId: userId,
      },
    },
  );

  if (!res.ok) {
    throw new Error('Failed to fetch course data');
  }

  return res.json();
}

const AddCourseSection = ({ className, userId }) => {
  const [coursesProgress, setCoursesProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getCourseProgress = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCourseProgress(userId);
      setCoursesProgress(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCourseHandler = () => {
    getCourseProgress();
  };

  useEffect(() => {
    if (userId) {
      getCourseProgress();
    }
  }, [userId]);

  return (
    <div
      className={`rounded-xl bg-surface-light p-4 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-4 text-sm font-semibold text-secondary sm:text-base md:text-lg'>
        دوره های کاربر
      </h2>
      <UserCourseRow
        coursesProgress={coursesProgress}
        loading={isLoading}
        userId={userId}
        addedCourse={addCourseHandler}
      />
    </div>
  );
};

AddCourseSection.propTypes = {
  className: PropTypes.string,
  userId: PropTypes.string.isRequired,
};

export default AddCourseSection;
