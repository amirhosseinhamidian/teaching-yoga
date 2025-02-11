/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import ProgressBar from '@/components/Ui/ProgressBar/ProgressBar ';
import { ImSpinner2 } from 'react-icons/im';
import { IoIosAddCircleOutline } from 'react-icons/io';
import AddUserCourseModal from '../../modules/AddUserCourseModal/AddUserCourseModal';
import { LuTrash } from 'react-icons/lu';
import Modal from '@/components/modules/Modal/Modal';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const UserCourseRow = ({
  className,
  coursesProgress,
  loading,
  userId,
  addedCourse,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseTempId, setCourseTempId] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    setCourses(coursesProgress);
  }, [coursesProgress]);

  const handleDeleteCourseModal = (courseId) => {
    setCourseTempId(courseId);
    setShowDeleteModal(true);
  };

  const deleteCourse = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/users/course`,
        {
          method: 'DELETE',
          body: JSON.stringify({
            userId,
            courseId: courseTempId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.showErrorToast(data.error);
      } else {
        toast.showSuccessToast(data.message);
        setCourses((prev) =>
          prev.filter((course) => course.courseId !== courseTempId),
        );
        setShowDeleteModal(false);
        setCourseTempId(null);
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره:');
    }
  };
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}
    >
      {loading ? (
        <div className='col-span-1 flex h-auto items-center justify-center rounded-xl bg-background-light dark:bg-background-dark'>
          <ImSpinner2 size={36} className='animate-spin text-primary' />
        </div>
      ) : (
        <>
          {courses?.map((course) => (
            <div
              className='relative col-span-1 flex flex-col items-center rounded-xl bg-background-light dark:bg-background-dark'
              key={course.courseId}
            >
              <div
                className='absolute left-2 top-2 flex cursor-pointer items-center justify-center rounded-full bg-background-light p-1.5 opacity-50 transition-all duration-200 ease-in hover:opacity-100 dark:bg-background-dark'
                onClick={() => handleDeleteCourseModal(course.courseId)}
              >
                <LuTrash size={16} className='text-red' />
              </div>
              <Image
                src={course.courseCover}
                alt={course.courseTitle}
                width={512}
                height={364}
                className='h-32 w-full overflow-hidden rounded-t-lg object-cover xs:h-44 sm:h-28 xl:h-48'
              />
              <h5 className='mt-4'>{course.courseTitle}</h5>
              <div className='w-full'>
                <ProgressBar progress={course.progress} className='my-4' />
              </div>
            </div>
          ))}
        </>
      )}

      <div
        className='col-span-1 flex h-auto min-h-44 flex-col items-center justify-center gap-3 rounded-xl bg-background-light transition-all duration-200 ease-in hover:brightness-95 md:cursor-pointer dark:bg-background-dark hover:dark:brightness-125'
        onClick={() => setShowAddCourseModal(true)}
      >
        <IoIosAddCircleOutline size={52} className='text-secondary' />
        <h5>افزودن دوره</h5>
      </div>

      {showAddCourseModal && (
        <AddUserCourseModal
          onClose={() => setShowAddCourseModal(false)}
          userId={userId}
          onSuccess={() => {
            setShowAddCourseModal(false);
            addedCourse();
          }}
        />
      )}
      {showDeleteModal && (
        <Modal
          title='حذف دوره'
          icon={LuTrash}
          iconColor='red'
          iconSize={32}
          desc='با حذف دوره ی کاربر تمام اطلاعات آن از سیستم حذف می شود و قابل بازیابی نیست. آیا از حذف مطمئن هستید؟'
          primaryButtonText='لغو'
          secondaryButtonText='حذف'
          primaryButtonClick={() => {
            setShowDeleteModal(false);
            setCourseTempId(null);
          }}
          secondaryButtonClick={() => {
            deleteCourse();
          }}
        />
      )}
    </div>
  );
};

UserCourseRow.propTypes = {
  className: PropTypes.string,
  coursesProgress: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  userId: PropTypes.string.isRequired,
  addedCourse: PropTypes.func.isRequired,
};

export default UserCourseRow;
