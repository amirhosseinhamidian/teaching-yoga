'use client';
import React, { useEffect, useState } from 'react';
import SectionEditProfile from './SectionEditProfile';
import { useAuth } from '@/contexts/AuthContext';
import SectionCourse from './SectionCourse';
import SectionQuestion from './SectionQuestion';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';
import SectionPaymentOrder from './SectionPaymentOrder';
import SectionTicket from './SectionTicket';

const ProfileMainBox = ({ status }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [questionsCount, setQuestionsCount] = useState(0);

  useEffect(() => {
    const fetchUnreadQuestions = async () => {
      try {
        const res = await fetch('/api/questions/unread-count', {
          headers: {
            'Content-Type': 'application/json',
            'user-id': user.id, // ارسال userId به API
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch unread questions count');
        }

        const data = await res.json();
        setQuestionsCount(data.unreadCount); // تنظیم تعداد سوالات خوانده نشده
      } catch (error) {
        console.error('Error fetching unread questions:', error);
      }
    };

    fetchUnreadQuestions();
  }, []);

  const coursesCount = user.courses.length;

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (status >= 0 && status <= 4) {
      setActiveIndex(status);
    }
  }, [status]);
  const profileItems = [
    { name: 'دوره ها', statusNumber: coursesCount },
    // { name: 'کلاس آنلاین', statusNumber: 0 },
    { name: 'سوالات', statusNumber: questionsCount },
    { name: 'سوابق خرید', statusNumber: 0 },
    { name: 'تیکت', statusNumber: 0 },
    { name: 'ویرایش پروفایل', statusNumber: 0 },
  ];

  const handleButtonClick = (index) => {
    setActiveIndex(index);
    router.push(`?active=${index}`);
  };

  return (
    <div className='my-7 flex w-full flex-col rounded-xl bg-surface-light sm:my-14 sm:flex-row dark:bg-surface-dark'>
      <div className='hide-scrollbar flex gap-8 overflow-x-auto border-b border-gray-300 p-4 px-8 sm:flex-col sm:gap-6 sm:border-b-0 sm:border-l sm:p-6 dark:border-gray-600'>
        {profileItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleButtonClick(index)}
            className={`relative flex items-center whitespace-nowrap text-right text-xs transition-all duration-200 ease-in-out after:absolute after:right-[-16px] after:top-1/2 after:h-1 after:w-0 after:rounded-full after:bg-secondary after:transition-all after:duration-200 after:ease-in-out hover:text-secondary hover:after:w-3 sm:ml-8 ${activeIndex === index ? 'text-secondary after:w-3' : ''} sm:text-base md:cursor-pointer`}
          >
            {item.name}
            {item.statusNumber > 0 && (
              <div className='mr-1 flex h-5 w-5 items-start justify-center rounded-full bg-red sm:mr-2 sm:h-6 sm:w-6'>
                <span className='font-faNa text-xs text-white sm:pt-0.5 sm:text-sm'>
                  {item.statusNumber}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className='w-full p-4 sm:p-6'>
        {activeIndex === 0 && <SectionCourse />}
        {activeIndex === 1 && <SectionQuestion />}
        {activeIndex === 2 && <SectionPaymentOrder />}
        {activeIndex === 3 && <SectionTicket />}
        {activeIndex === 4 && <SectionEditProfile />}
      </div>
    </div>
  );
};

ProfileMainBox.propTypes = {
  status: PropTypes.number,
};

export default ProfileMainBox;
