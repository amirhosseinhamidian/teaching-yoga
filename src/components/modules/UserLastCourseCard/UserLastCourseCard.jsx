/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Button from '@/components/Ui/Button/Button';
import { ImSpinner } from 'react-icons/im';
import { useRouter } from 'next/navigation';

const UserLastCourseCard = ({ courseId, className }) => {
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNextSessionLoading, setIsNextSessionLoading] = useState(false);
  const handleNextSessionClick = async () => {
    try {
      setIsNextSessionLoading(true);
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
      setIsNextSessionLoading(false);
    }
  };
  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/courses/user/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      const data = await res.json();
      setCourse(data.data);
    } catch (error) {
      console.error('Error fetching course:', error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);
  return (
    <div className={`mb-6 mt-6 sm:mb-0 sm:mt-8 md:mt-16 ${className}`}>
      {loading ? (
        <div className=''>
          <ImSpinner className='mx-auto animate-spin' />
        </div>
      ) : (
        <div className='rounded-xl px-3 py-4 shadow-accent-custom'>
          <h2 className='mr-3 font-fancy text-lg text-secondary xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl'>
            ادامه بده!
          </h2>
          <div className='mt-2 flex gap-3'>
            <Image
              src={course.cover}
              alt={course.title}
              width={800}
              height={600}
              className='h-14 w-16 rounded-xl xs:h-20 xs:w-24 md:h-24 md:w-28'
            />
            <div className='flex flex-col items-center gap-5'>
              <h4 className='text-sm sm:text-base'>{course.title}</h4>
              <Button
                className='text-xs xs:text-sm md:text-base'
                onClick={handleNextSessionClick}
                isLoading={isNextSessionLoading}
              >
                جلسه بعدی
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

UserLastCourseCard.propTypes = {
  courseId: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default UserLastCourseCard;
