'use client';
import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import { RiQuestionAnswerLine } from 'react-icons/ri';

const QuestionSliderItem = ({ question }) => {
  const { user } = useAuth();
  return (
    <div className='grid grid-cols-5 gap-4'>
      <div className='col-span-5 rounded-xl border border-subtext-light px-4 py-2 md:col-span-4 dark:border-subtext-dark'>
        <div className='flex items-center gap-2'>
          <Image
            src={user?.avatar || '/images/default-profile.png'}
            alt={user.username}
            width={256}
            height={256}
            className='h-14 w-14 rounded-full'
          />
          <div className='flex flex-col'>
            <span>{user.username}</span>
            <span className='font-faNa text-xs text-subtext-light sm:text-sm dark:text-subtext-dark'>
              {getShamsiDate(question.updatedAt)}
            </span>
          </div>
        </div>
        <div className='mt-4 flex flex-wrap items-center gap-2'>
          <span className='whitespace-nowrap rounded-full border border-gray-500 px-2 py-1 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
            {question.courseTitle}
          </span>
          <span className='whitespace-nowrap rounded-full border border-gray-500 px-2 py-1 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
            {question.termName}
          </span>
          <span className='whitespace-nowrap rounded-full border border-gray-500 px-2 py-1 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
            {question.sessionName}
          </span>
        </div>
        <p className='mr-2 mt-4 text-xs sm:mr-16 sm:text-sm'>
          {question.questionText}
        </p>
      </div>
      {question.isAnswered ? (
        <div className='col-span-5 rounded-xl border border-subtext-light px-4 py-2 md:col-span-4 md:col-start-2 dark:border-subtext-dark'>
          <div className='flex items-center gap-2'>
            <Image
              src={question?.instructorAvatar || '/images/default-profile.png'}
              alt={question.instructorUsername}
              width={256}
              height={256}
              className='h-14 w-14 rounded-full'
            />
            <div className='flex flex-col'>
              <span>{question.instructorUsername}</span>
              <span className='font-faNa text-xs text-subtext-light sm:text-sm dark:text-subtext-dark'>
                {getShamsiDate(question.answeredAt)}
              </span>
            </div>
          </div>
          <p className='mr-2 mt-4 text-xs sm:mr-16 sm:mt-2 sm:text-sm'>
            {question.answerText}
          </p>
        </div>
      ) : (
        <div className='col-span-5 flex min-h-44 flex-col items-center justify-center gap-4 rounded-xl border border-subtext-light px-4 py-2 text-xs text-secondary sm:text-sm md:col-span-4 md:col-start-2 dark:border-subtext-dark'>
          <RiQuestionAnswerLine size={42} className='text-secondary' />
          مربی در حال بررسی و پاسخ به سوال شماست. از صبر و شکیبایی شما متشکریم.
        </div>
      )}
    </div>
  );
};

QuestionSliderItem.propTypes = {
  question: PropTypes.object.isRequired,
};

export default QuestionSliderItem;
