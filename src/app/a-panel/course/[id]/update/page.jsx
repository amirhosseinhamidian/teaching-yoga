/* eslint-disable react/prop-types */

import React from 'react';

import prismadb from '@/libs/prismadb';

import CreateCourseUpdateForm from '@/app/a-panel/components/templates/createUpdateCourse/CreateUpdateCourseForm';

/*
|--------------------------------------------------------------------------
| Admin edit page must always be dynamic
|--------------------------------------------------------------------------
*/

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/*
|--------------------------------------------------------------------------
| Fetch fresh course directly from database
|--------------------------------------------------------------------------
*/

const fetchCourseData = async (id) => {
  try {
    const courseId = Number(id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
      console.error('[COURSE_UPDATE_PAGE] Invalid course id:', id);

      return null;
    }

    const course = await prismadb.course.findUnique({
      where: {
        id: courseId,
      },

      include: {
        /*
         * فرم برای مقداردهی پلن‌های انتخاب شده
         * به این Relation نیاز دارد.
         */
        subscriptionPlanCourses: {
          select: {
            planId: true,
          },
        },
      },
    });

    if (!course) {
      console.error('[COURSE_UPDATE_PAGE] Course not found:', courseId);

      return null;
    }

    /*
     * چون CreateCourseUpdateForm یک Client Component است،
     * داده Prisma را به plain JSON تبدیل می‌کنیم.
     *
     * Date -> string
     * Decimal/objects -> serializable
     */
    return JSON.parse(JSON.stringify(course));
  } catch (error) {
    console.error('[COURSE_UPDATE_PAGE] Error fetching course:', error);

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

const CourseUpdatePage = async ({ params }) => {
  const { id } = params;

  const courseData = await fetchCourseData(id);

  if (!courseData) {
    return (
      <div className='flex min-h-[300px] items-center justify-center px-4'>
        <div className='border-red-500/10 bg-red-500/5 rounded-2xl border px-5 py-4 text-center'>
          <p className='text-red-500 text-sm font-semibold'>
            اطلاعات دوره دریافت نشد.
          </p>

          <p className='mt-1 text-xs opacity-70'>
            شناسه دوره یا اتصال به دیتابیس را بررسی کنید.
          </p>
        </div>
      </div>
    );
  }

  return <CreateCourseUpdateForm courseToUpdate={courseData} />;
};

export default CourseUpdatePage;
