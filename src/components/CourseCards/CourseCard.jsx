/* eslint-disable no-undef */
'use client';
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '../Ui/Button/Button';
import { GrYoga } from 'react-icons/gr';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import Link from 'next/link';
import { TiInfoLarge } from 'react-icons/ti';

export default function CourseCard({ course, className }) {
  const router = useRouter();
  const { user } = useAuth();
  const [isEnterCourseLoading, setIsLoadingCourseLoading] = useState(false);
  const purchasedCourses = user?.courses || [];
  const isCoursePurchased = purchasedCourses.some(
    (userCourse) => userCourse.courseId === course.id,
  );

  const detailClickHandler = () => {
    router.push(`/courses/${course.shortAddress}`);
  };

  const courseClickHandler = async () => {
    try {
      setIsLoadingCourseLoading(true);
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
      setIsLoadingCourseLoading(false);
    }
  };
  return (
    <div className={`flex w-full flex-col rounded-xl shadow-md ${className}`}>
      <Image
        src={course.cover}
        alt={course.title}
        className='max-h-48 w-full rounded-t-xl object-cover xs:max-h-72'
        width={600}
        height={540}
      />
      <div className='flex h-full flex-col justify-between gap-2 px-3 pb-3 pt-1 md:px-6 md:pb-4 md:pt-2'>
        <div>
          <h2 className='mb-2 text-base font-semibold text-text-light md:text-lg dark:text-text-dark'>
            {course.title}
          </h2>
          <p className='text-2xs text-subtext-light sm:text-xs lg:text-sm dark:text-subtext-dark'>
            {course.subtitle}
          </p>
        </div>

        {isCoursePurchased ? (
          <div className='w-full'>
            <div className='mb-4 flex gap-1 text-green lg:mb-5'>
              <GrYoga className='min-h-6 min-w-6' />
              <p className='text-sm lg:text-base'>شما هنرجوی این دوره هستید.</p>
            </div>
            <div className='flex w-full items-center gap-4'>
              <Button
                shadow
                className='w-full text-xs sm:text-sm md:text-base'
                isLoading={isEnterCourseLoading}
                onClick={courseClickHandler}
              >
                ورود به دوره
              </Button>
              <Link href={`/courses/${course.shortAddress}`}>
                <IconButton icon={TiInfoLarge} size={28} />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <Price
              finalPrice={course.finalPrice}
              price={course.price}
              discount={course.discount}
              className='mb-4 lg:mb-6'
            />
            <CardActions
              mainBtnClick={detailClickHandler}
              className='mt-auto'
              courseId={course.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
