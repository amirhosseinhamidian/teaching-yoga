'use client';
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';
import { useRouter } from 'next/navigation';
import { prizeCountdown } from '@/utils/prizeCountdown';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { GrYoga } from 'react-icons/gr';
import Button from '../Ui/Button/Button';
import Link from 'next/link';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { TiInfoLarge } from 'react-icons/ti';

export default function CourseHighCard({ course }) {
  const route = useRouter();
  const { user } = useAuth();
  const purchasedCourses = user?.courses || [];
  const isCoursePurchased = purchasedCourses.some(
    (userCourse) => userCourse.courseId === course.id,
  );
  const [isEnterCourseLoading, setIsLoadingCourseLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const detailCourseClickHandler = () => {
    route.push(`/courses/${course.shortAddress}`);
  };
  useEffect(() => {
    setCountdown(prizeCountdown());
    const timer = setInterval(() => {
      setCountdown(prizeCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const courseClickHandler = async () => {
    try {
      setIsLoadingCourseLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${course.shortAddress}/next-session`,
      );
      if (response.ok) {
        const { sessionId } = await response.json();
        route.push(`/courses/${course.shortAddress}/lesson/${sessionId}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCourseLoading(false);
    }
  };
  return (
    <div className='flex w-full flex-col-reverse rounded-xl bg-surface-light shadow-md md:flex-row dark:bg-surface-dark'>
      <div className='flex flex-1 flex-col p-5'>
        <h2 className='text-lg font-semibold text-text-light md:text-xl dark:text-text-dark'>
          {course.title}
        </h2>
        <p className='mt-2 text-xs text-subtext-light md:mt-4 md:text-sm dark:text-subtext-dark'>
          {course.subtitle}
        </p>
        {/* <div className='mt-4 flex w-fit items-baseline justify-between gap-2 self-end rounded-full bg-slate-700 bg-opacity-70 px-4 py-2 xl:mt-10'>
          <span className='font-fancy text-sm text-white sm:text-lg'>
            پیشنهاد ویژه:
          </span>
          <span className='pt-1 font-fancy text-sm text-white sm:text-lg'>
            {countdown}
          </span>
        </div> */}
        {isCoursePurchased ? (
          <div className='mt-6'>
            <div className='flex items-center gap-4'>
              <Button
                shadow
                className='w-full text-xs sm:text-sm md:w-fit md:text-base'
                isLoading={isEnterCourseLoading}
                onClick={courseClickHandler}
              >
                ورود به دوره
              </Button>
              <Link href={`/courses/${course.shortAddress}`}>
                <IconButton icon={TiInfoLarge} size={28} />
              </Link>
            </div>
            <div className='mt-4 flex gap-1 text-green md:mt-8'>
              <GrYoga className='min-h-6 min-w-6' />
              <p className='text-sm lg:text-base'>شما هنرجوی این دوره هستید.</p>
            </div>
          </div>
        ) : (
          <div className='mt-5 flex flex-col-reverse gap-5 md:flex-row md:justify-between'>
            <CardActions
              mainBtnClick={detailCourseClickHandler}
              courseId={course.id}
            />
            <Price
              finalPrice={course.finalPrice}
              price={course.price}
              discount={course.discount}
            />
          </div>
        )}
      </div>
      <Image
        src={course.cover}
        alt={course.title}
        width={600}
        height={540}
        className='max-h-48 w-full rounded-t-xl object-cover xs:max-h-72 sm:h-auto md:w-1/3 md:rounded-none md:rounded-e-xl'
      />
    </div>
  );
}
