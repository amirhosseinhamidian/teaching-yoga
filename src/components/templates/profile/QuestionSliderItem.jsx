'use client';

import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { getShamsiDate } from '@/utils/dateTimeHelper';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

import {
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { RiQuestionAnswerLine } from 'react-icons/ri';

const QuestionSliderItem = ({ question }) => {
  const { user } = useAuthUser();

  return (
    <div className='space-y-4 pb-8'>
      <div className='flex flex-wrap items-center gap-2'>
        <SiteBadge variant='secondary' size='sm'>
          {question.courseTitle}
        </SiteBadge>

        <span className='rounded-xl border border-black/5 bg-background-light/45 px-2.5 py-1.5 text-[9px] font-bold text-subtext-light sm:text-[10px] dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
          {question.termName}
        </span>

        <span className='rounded-xl border border-black/5 bg-background-light/45 px-2.5 py-1.5 text-[9px] font-bold text-subtext-light sm:text-[10px] dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
          {question.sessionName}
        </span>
      </div>

      <SiteCard
        variant='glass'
        padding='none'
        radius='md'
        className='relative overflow-hidden p-4 sm:p-5'
      >
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-secondary/15 bg-secondary/10 sm:h-12 sm:w-12'>
              <Image
                src={user?.avatar || '/images/default-profile.png'}
                alt={user?.username || 'کاربر'}
                fill
                sizes='48px'
                className='object-cover'
              />
            </div>

            <div className='min-w-0'>
              <p className='truncate text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                {user?.username}
              </p>
              <p className='mt-0.5 font-faNa text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                {getShamsiDate(question.updatedAt)}
              </p>
            </div>
          </div>

          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
            <HiOutlineChatBubbleLeftEllipsis size={18} />
          </span>
        </div>

        <p className='text-xs leading-7 text-text-light sm:text-sm sm:leading-8 dark:text-text-dark'>
          {question.questionText}
        </p>
      </SiteCard>

      {question.isAnswered ? (
        <SiteCard
          variant='glass'
          padding='none'
          radius='md'
          topLine
          className='relative overflow-hidden p-4 sm:p-5'
        >
          <div
            aria-hidden='true'
            className='absolute -left-20 -top-20 h-44 w-44 rounded-full bg-secondary/10 blur-[70px]'
          />

          <div className='relative z-10'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
              <div className='flex min-w-0 items-center gap-3'>
                <div className='relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-secondary/15 bg-secondary/10 sm:h-12 sm:w-12'>
                  <Image
                    src={
                      question?.instructorAvatar || '/images/default-profile.png'
                    }
                    alt={question.instructorUsername}
                    fill
                    sizes='48px'
                    className='object-cover'
                  />
                </div>

                <div className='min-w-0'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                      {question.instructorUsername}
                    </p>

                    <HiOutlineCheckCircle size={15} className='text-secondary' />
                  </div>

                  <p className='mt-0.5 font-faNa text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    {getShamsiDate(question.answeredAt)}
                  </p>
                </div>
              </div>

              <SiteBadge variant='secondary' size='sm'>
                <span className='flex items-center gap-1.5'>
                  <HiOutlineSparkles size={13} />
                  پاسخ مربی
                </span>
              </SiteBadge>
            </div>

            <div
              className='text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark [&_a]:font-bold [&_a]:text-secondary [&_p]:my-2 [&_strong]:font-black [&_strong]:text-text-light dark:[&_strong]:text-text-dark'
              dangerouslySetInnerHTML={{ __html: question.answerText }}
            />
          </div>
        </SiteCard>
      ) : (
        <div className='flex min-h-40 flex-col items-center justify-center rounded-[22px] border border-dashed border-secondary/20 bg-secondary/5 px-5 text-center'>
          <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <RiQuestionAnswerLine size={25} />
          </span>

          <div className='mt-3 flex items-center gap-1.5 text-secondary'>
            <HiOutlineClock size={15} />
            <span className='text-[10px] font-black sm:text-xs'>در انتظار پاسخ</span>
          </div>

          <p className='mt-1.5 max-w-md text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
            مربی در حال بررسی و پاسخ به سوال شماست. از صبر و شکیبایی شما
            متشکریم.
          </p>
        </div>
      )}
    </div>
  );
};

QuestionSliderItem.propTypes = {
  question: PropTypes.object.isRequired,
};

export default QuestionSliderItem;
