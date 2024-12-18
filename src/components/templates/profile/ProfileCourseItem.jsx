/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import ProgressBar from '@/components/Ui/ProgressBar/ProgressBar ';
import Button from '@/components/Ui/Button/Button';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useRouter } from 'next/navigation';

const ProfileCourseItem = ({ course, className }) => {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);
  const handleNextSessionClick = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.shortAddress}/next-session`,
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
      className={`flex flex-col items-center rounded-xl bg-background-light dark:bg-background-dark ${className}`}
    >
      <Image
        src={course.courseCover}
        alt={course.courseTitle}
        width={512}
        height={364}
        className='h-32 w-full overflow-hidden rounded-t-lg object-cover xs:h-44 sm:h-28 xl:h-48'
      />
      <h5 className='mt-4'>{course.courseTitle}</h5>
      <div className='w-full'>
        <ProgressBar progress={course.progress} className='my-4' />
      </div>
      <Button
        className='mb-4 flex items-center gap-1'
        onClick={handleNextSessionClick}
        disable={isLoading}
      >
        جلسه بعدی
        {isLoading && (
          <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
        )}
      </Button>
    </div>
  );
};

ProfileCourseItem.propTypes = {
  course: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default ProfileCourseItem;
