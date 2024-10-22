import CourseCard from '@/components/CourseCards/CourseCard';
import CourseHighCard from '@/components/CourseCards/CourseHighCard';
import React from 'react';
import { getAllCourses } from '../actions/courseActions';

export default async function page() {
  const courses = await getAllCourses();
  return (
    <div className='container'>
      <h1 className='my-4 text-xl font-semibold md:my-6 md:text-3xl'>
        دوره‌ها
      </h1>
      <div className='my-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
        {courses.map(course => {
          return course.isHighPriority ? (
            <div 
              key={course.id} 
              className='col-span-1 sm:col-span-2 md:col-span-3'
            >
              <CourseHighCard course={course} />
            </div>
          ) : (
            <div 
              key={course.id} 
              className='col-span-1'
            >
              <CourseCard course={course} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
