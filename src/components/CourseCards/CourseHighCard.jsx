/* eslint-disable react/prop-types */
import React from 'react';
import Price from '../Price/Price';
import CardActions from './CardActions';
import { useRouter } from 'next/navigation';

export default function CourseHighCard({ course }) {
  const route = useRouter()
  const detailCourseClickHandler = () => {
    route.push(`/${course.shortAddress}`)
  }
  return (
    <div className='flex w-full flex-col-reverse rounded-xl bg-surface-light shadow-md md:flex-row dark:bg-surface-dark'>
      <div className='flex flex-1 flex-col p-5'>
        <h2 className='text-lg font-semibold text-text-light md:text-xl dark:text-text-dark'>
          {course.title}
        </h2>
        <p className='mt-2 text-xs text-subtext-light md:mt-4 md:text-sm dark:text-subtext-dark'>
          {course.subtitle}
        </p>
        <div className='mt-4 flex w-fit items-baseline justify-between gap-2 self-end rounded-full bg-slate-700 bg-opacity-70 px-4 py-2 xl:mt-10'>
          <span className='font-fancy text-sm text-white sm:text-lg'>
            پیشنهاد ویژه:
          </span>
          <span className='pt-1 font-fancy text-sm text-white sm:text-lg'>
            {' '}
            00:00:00
          </span>
        </div>
        <div className='mt-5 flex flex-col-reverse gap-5 md:flex-row md:justify-between'>
          <CardActions mainBtnClick={detailCourseClickHandler}/>
          <Price
            price={Number(course.price)}
            basePrice={Number(course.basePrice)}
          />
        </div>
      </div>
      <img
        src='/images/c1.jpg'
        alt=''
        className='h-auto w-full rounded-t-xl object-cover md:w-1/3 md:rounded-none md:rounded-e-xl'
      />
    </div>
  );
}
