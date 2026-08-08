'use client';

import React, { useState } from 'react';

import PropTypes from 'prop-types';
import Image from 'next/image';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteTextArea from '@/components/SiteUi/Form/SiteTextArea';

import { IoWarningOutline } from 'react-icons/io5';

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineQuestionMarkCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const QuestionBox = ({ className = '', courseId, sessionId }) => {
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

      body: JSON.stringify({
        courseId,
        sessionId,
        questionText,
      }),
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
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`px-5 py-7 sm:px-7 sm:py-8 ${className}`}
    >
      <div
        aria-hidden='true'
        className='absolute -left-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[80px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='flex items-start gap-4'>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineQuestionMarkCircle size={25} />
          </span>

          <div>
            <div className='flex items-center gap-2 text-secondary'>
              <HiOutlineSparkles size={15} />

              <span className='text-[10px] font-bold sm:text-xs'>
                ارتباط با مدرس
              </span>
            </div>

            <h2 className='mt-1 text-lg font-black leading-8 text-text-light sm:text-xl dark:text-text-dark'>
              درباره این جلسه سؤال داری؟
            </h2>

            <p className='mt-1.5 text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
              سؤال مرتبط با همین جلسه را اینجا ثبت کن.
            </p>
          </div>
        </div>

        {/* Notice */}
        <div className='mt-5 flex items-start gap-3 rounded-[18px] border border-blue/20 bg-blue/5 px-4 py-3 text-blue'>
          <IoWarningOutline size={21} className='mt-0.5 shrink-0' />

          <p className='text-[10px] leading-6 sm:text-xs'>
            اگر سؤالی در ارتباط با این جلسه دارید اینجا بنویسید. سؤالات مربوط به
            دوره‌ها و سایر موضوعات را از طریق تیکت در پروفایل از ما بپرسید.
          </p>
        </div>

        {/* User */}
        <div className='mt-5 flex items-center gap-3'>
          <Image
            src={user?.avatar || '/images/default-profile.png'}
            alt='user profile'
            width={50}
            height={50}
            className='h-11 w-11 shrink-0 rounded-[14px] border border-black/5 object-cover shadow-sm dark:border-white/10'
          />

          <div className='min-w-0'>
            <p className='truncate text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
              {user?.username}
            </p>

            <div className='mt-1 flex items-center gap-1.5 text-[9px] font-bold text-secondary'>
              <HiOutlineChatBubbleLeftRight size={13} />

              <span>سؤال خودت را بنویس</span>
            </div>
          </div>
        </div>

        <SiteTextArea
          value={content}
          onChange={setContent}
          disabled={sendLoading}
          rows={5}
          placeholder='سوالت رو بنویس'
          className='mt-4'
          textareaClassName='min-h-[135px]'
        />

        <div className='mt-4 flex justify-end'>
          <SiteButton
            type='button'
            variant='primary'
            size='md'
            startIcon={HiOutlineChatBubbleLeftRight}
            loading={sendLoading}
            disabled={sendLoading}
            onClick={sendCommentHandler}
            className='w-full sm:w-auto'
          >
            ارسال سؤال
          </SiteButton>
        </div>
      </div>
    </SiteCard>
  );
};

QuestionBox.propTypes = {
  className: PropTypes.string,

  courseId: PropTypes.number.isRequired,

  sessionId: PropTypes.string.isRequired,
};

export default QuestionBox;
