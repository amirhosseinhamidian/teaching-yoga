'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SectionEditProfile from './SectionEditProfile';
import { useAuth } from '@/contexts/AuthContext';
import SectionCourse from './SectionCourse';
import SectionQuestion from './SectionQuestion';

const ProfileMainBox = () => {
  const { user } = useAuth();
  console.log('user =>', user);
  const questionsCount = user.questions.length;
  const coursesCount = user.courses.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const profileItems = [
    { name: 'ویرایش پروفایل', statusNumber: 0 },
    { name: 'دوره ها', statusNumber: coursesCount },
    { name: 'کلاس آنلاین', statusNumber: 0 },
    { name: 'سوابق خرید', statusNumber: 0 },
    { name: 'تیکت', statusNumber: 0 },
    { name: 'سوالات', statusNumber: questionsCount },
  ];

  return (
    <div className='my-7 flex w-full flex-col rounded-xl bg-surface-light sm:my-14 sm:flex-row dark:bg-surface-dark'>
      <div className='hide-scrollbar flex gap-8 overflow-x-auto border-b border-gray-300 p-4 px-8 sm:flex-col sm:gap-6 sm:border-b-0 sm:border-l sm:p-6 dark:border-gray-600'>
        {profileItems.map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`relative flex items-center whitespace-nowrap text-right text-xs transition-all duration-200 ease-in-out after:absolute after:right-[-16px] after:top-1/2 after:h-1 after:w-0 after:rounded-full after:bg-secondary after:transition-all after:duration-200 after:ease-in-out hover:text-secondary hover:after:w-3 sm:ml-8 ${activeIndex === index ? 'text-secondary after:w-3' : ''} sm:text-base md:cursor-pointer`}
          >
            {item.name}
            {item.statusNumber > 0 && (
              <div className='mr-1 flex h-4 w-4 items-start justify-center rounded-full bg-red sm:mr-2 sm:h-6 sm:w-6'>
                <span className='font-faNa text-white'>
                  {item.statusNumber}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className='w-full p-4 sm:p-6'>
        {activeIndex === 0 && <SectionEditProfile />}
        {activeIndex === 1 && <SectionCourse />}
        {activeIndex === 5 && <SectionQuestion />}
      </div>
    </div>
  );
};

ProfileMainBox.propTypes = {};

export default ProfileMainBox;
