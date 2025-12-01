'use client';
import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import { RiQuestionAnswerLine } from 'react-icons/ri';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const QuestionSliderItem = ({ question }) => {
  const { user } = useAuthUser();
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
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
      <div className='flex flex-col rounded-xl border border-subtext-light px-4 py-2 lg:flex-row dark:border-subtext-dark'>
        <div>
          <div className='flex items-center gap-2'>
            <Image
              src={user?.avatar || '/images/default-profile.png'}
              alt={user.username}
              width={256}
              height={256}
              className='h-11 w-11 rounded-full border xs:h-12 xs:w-12 sm:h-14 sm:w-14'
            />
            <div className='flex flex-col'>
              <span className='text-sm sm:text-base'>{user.username}</span>
              <span className='font-faNa text-xs text-subtext-light sm:text-sm dark:text-subtext-dark'>
                {getShamsiDate(question.updatedAt)}
              </span>
            </div>
          </div>
        </div>
        <p className='my-4 mr-2 text-xs sm:mr-16 sm:text-sm lg:mr-8'>
          {question.questionText}
        </p>
      </div>
      {question.isAnswered ? (
        <div className='flex flex-col rounded-xl border border-subtext-light px-4 py-2 lg:flex-row dark:border-subtext-dark'>
          <div className='flex items-center gap-2'>
            <Image
              src={question?.instructorAvatar || '/images/default-profile.png'}
              alt={question.instructorUsername}
              width={256}
              height={256}
              className='h-14 w-14 rounded-full'
            />
            <div className='flex flex-col'>
              <span className='text-sm sm:text-base'>
                {question.instructorUsername}
              </span>
              <span className='font-faNa text-xs text-subtext-light sm:text-sm dark:text-subtext-dark'>
                {getShamsiDate(question.answeredAt)}
              </span>
            </div>
          </div>
          <div className='my-4 mr-2 text-xs sm:mr-16 sm:text-sm lg:mr-8'>
            <div
              dangerouslySetInnerHTML={{ __html: question.answerText }} // رندر HTML در JSX
            />
          </div>
        </div>
      ) : (
        <div className='flex min-h-44 flex-col items-center justify-center gap-4 rounded-xl border border-subtext-light px-4 py-2 text-xs text-secondary sm:text-sm dark:border-subtext-dark'>
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
