/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import ProgressBar from '@/components/Ui/ProgressBar/ProgressBar ';
import Button from '@/components/Ui/Button/Button';
import { useRouter } from 'next/navigation';

const ProfileCourseItem = ({ course, className }) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);
  const handleNextSessionClick = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.shortAddress}/next-session`
      );
      if (response.ok) {
        const { sessionId } = await response.json();
        router.push(`/courses/${course.shortAddress}/lesson/${sessionId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={`flex flex-col items-center justify-between rounded-xl bg-background-light dark:bg-background-dark ${className}`}
    >
      <div>
        <div className='h-32 w-full overflow-hidden rounded-t-lg xs:h-44 sm:h-28 xl:h-48'>
          <Image
            src={course.courseCover}
            alt={course.courseTitle}
            width={512}
            height={364}
            className='object-cover'
          />
        </div>
        <h5 className='mx-3 mt-4 text-center text-xs xs:text-sm lg:text-base'>
          {course.courseTitle}
        </h5>
      </div>
      <div className='flex w-full flex-col items-center'>
        <ProgressBar progress={course.progress} className='my-4' />
        <Button
          className='mb-4 text-xs sm:text-sm'
          onClick={handleNextSessionClick}
          isLoading={isLoading}
        >
          جلسه بعدی
        </Button>
      </div>
    </div>
  );
};

ProfileCourseItem.propTypes = {
  course: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default ProfileCourseItem;
