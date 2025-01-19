/* eslint-disable no-undef */
import CourseCard from '@/components/CourseCards/CourseCard';
import CourseHighCard from '@/components/CourseCards/CourseHighCard';
import React from 'react';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { headers } from 'next/headers';

async function CoursesPage() {
  const session = await getServerSession(authOptions);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses`,
    {
      method: 'GET',
      headers: headers(),
      next: {
        revalidate: 7200, // 2 hours
      },
    },
  );

  const result = await res.json();
  if (!result.success) {
    // TODO: error request ui with refresh button
  }

  const courses = result.data;

  if (courses === 0) {
    return <p>loading</p>;
  }

  return (
    <>
      <Header isLogin={session} />
      <div className='container'>
        <PageTitle>دوره‌ها</PageTitle>
        <div className='my-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {courses.map((course) => {
            return course.isHighPriority ? (
              <div
                key={course.id}
                className='col-span-1 sm:col-span-2 lg:col-span-3'
              >
                <CourseHighCard course={course} />
              </div>
            ) : (
              <div key={course.id}>
                <CourseCard
                  course={course}
                  className='h-full bg-surface-light dark:bg-surface-dark'
                />
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CoursesPage;
