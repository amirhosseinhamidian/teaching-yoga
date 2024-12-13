'use client';
/* eslint-disable react/prop-types */
import React from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CourseCard({ course }) {
  const router = useRouter();
  const detailClickHandler = () => {
    router.push(`/courses/${course.shortAddress}`);
  };
  return (
    <div className='flex w-full flex-col rounded-xl bg-surface-light shadow-md dark:bg-surface-dark'>
      <Image
        src={course.cover}
        alt={course.title}
        className='h-auto w-full rounded-t-xl object-cover'
        width={600}
        height={540}
      />
      <div className='flex flex-col gap-2 px-3 pb-3 pt-1 md:px-6 md:pb-4 md:pt-2'>
        <h2 className='text-center text-lg font-semibold text-text-light md:text-xl dark:text-text-dark'>
          {course.title}
        </h2>
        <p className='text-xs text-subtext-light md:text-sm dark:text-subtext-dark'>
          {course.subtitle}
        </p>
        <Price
          finalPrice={course.finalPrice}
          price={course.price}
          discount={course.discount}
        />
        <CardActions mainBtnClick={detailClickHandler} />
      </div>
    </div>
  );
}
