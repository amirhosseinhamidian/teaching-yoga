import CourseCard from '@/components/CourseCards/CourseCard';
import CourseHighCard from '@/components/CourseCards/CourseHighCard';
import React from 'react';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';

async function CoursesPage() {
  const res = await fetch('http://localhost:3000/api/courses');

  const result = await res.json();
  if (!result.success) {
    // TODO: error request ui with refresh button
  }

  const courses = result.data;

  if (courses === 0) {
    // TODO: empty page ui
  }

  return (
    <div className='container'>
      <PageTitle>دوره‌ها</PageTitle>
      <div className='my-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
        {courses.map((course) => {
          return course.isHighPriority ? (
            <div
              key={course.id}
              className='col-span-1 sm:col-span-2 md:col-span-3'
            >
              <CourseHighCard course={course} />
            </div>
          ) : (
            <div key={course.id} className='col-span-1'>
              <CourseCard course={course} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CoursesPage;
