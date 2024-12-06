/* eslint-disable react/prop-types */
import CreateCourseUpdateForm from '@/app/a-panel/components/templates/createUpdateCourse/CreateUpdateCourseForm';
import React from 'react';

const fetchCourseData = async (id) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/admin/courses/${id}`,
    );
    const data = await response.json();

    if (response.ok) {
      return data;
    } else {
      console.error('Error fetching course:', data.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const CourseUpdatePage = async ({ params }) => {
  const { id } = params;
  const courseData = await fetchCourseData(id);

  return (
    <div>
      <CreateCourseUpdateForm courseToUpdate={courseData} />
    </div>
  );
};

export default CourseUpdatePage;
