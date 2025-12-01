'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import TextArea from '@/components/Ui/TextArea/TextArea';
import Button from '@/components/Ui/Button/Button';
import { IoWarningOutline } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const QuestionBox = ({ className, courseId, sessionId }) => {
  const { user } = useAuthUser();
  const [content, setContent] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const submitQuestion = async (courseId, sessionId, questionText) => {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId, sessionId, questionText }),
    });

    const data = await response.json();
    if (response.ok) {
      toast.showSuccessToast(data.message);
    } else {
      toast.showErrorToast(data.message);
    }
  };
  const sendCommentHandler = async () => {
    setSendLoading(true);
    await submitQuestion(courseId, sessionId, content);
    setSendLoading(false);
    setContent('');
  };
  return (
    <div
      className={`rounded-xl bg-surface-light px-4 py-6 dark:bg-surface-dark ${className}`}
    >
      <h3 className='mb-4 font-semibold md:text-lg'>سوال دارم</h3>
      <div className='flex flex-col gap-4 pb-5'>
        <div className='flex rounded-xl border border-blue bg-blue bg-opacity-10 p-2 text-blue'>
          <IoWarningOutline className='ml-1 text-2xl' />
          <p className='text-thin text-xs'>
            اگر سوالی در ارتباط با این جلسه دارید اینجا بنویسید. سوالات در مورد
            دوره ها و سایر سوالات رو از طریق تکیت در پروفایل از ما بپرسید
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Image
            src={user.avatar || '/images/default-profile.png'}
            alt='user profile'
            width={50}
            height={50}
            className='rounded-full'
          />
          <p className='text-subtext-light dark:text-subtext-dark'>
            {user.username}
          </p>
        </div>
        <TextArea
          placeholder='سوالت رو بنویس'
          value={content}
          onChange={setContent}
          className=''
        />
        <div className='flex w-full items-center justify-end gap-2'>
          <Button onClick={sendCommentHandler} isLoading={sendLoading}>
            ارسال
          </Button>
        </div>
      </div>
    </div>
  );
};

QuestionBox.propTypes = {
  className: PropTypes.string,
  courseId: PropTypes.number.isRequired,
  sessionId: PropTypes.string.isRequired,
};

export default QuestionBox;
