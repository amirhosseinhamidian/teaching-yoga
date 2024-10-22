/* eslint-disable react/prop-types */
import React from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';

export default function CourseCard({ course }) {
  return (
    <div className='flex w-full flex-col rounded-xl bg-surface-light shadow-md dark:bg-surface-dark'>
      <img
        src='/images/c1.jpg'
        alt=''
        className='h-auto w-full rounded-t-xl object-cover'
      />
      <div className='flex flex-col gap-4 p-5 md:p-6'>
        <h2 className='text-center text-lg font-semibold text-text-light md:text-xl dark:text-text-dark'>
          {course.title}
        </h2>
        <p className='mt-2 text-xs text-subtext-light md:mt-3 md:text-sm dark:text-subtext-dark'>
          {course.subtitle}
        </p>
        <Price
          price={Number(course.price)}
          basePrice={Number(course.basePrice)}
        />
        <CardActions />
      </div>
    </div>
  );
}
