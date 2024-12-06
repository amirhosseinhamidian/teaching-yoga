import React from 'react';
import HeadActions from '../components/templates/course/HeadActions';
import CoursesTable from '../components/templates/course/CoursesTable';

function CourseAdminPage() {
  return (
    <div>
      <HeadActions />
      <CoursesTable />
    </div>
  );
}

export default CourseAdminPage;
