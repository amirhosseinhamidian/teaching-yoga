/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';

import QuestionSliderItem from './QuestionSliderItem';

import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2';
import { ImSpinner2 } from 'react-icons/im';

async function fetchQuestions() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questions`,
      {
        cache: 'no-store',
        method: 'GET',
      }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch course data');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function markQuestionAsRead(questionId) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questions/${questionId}`,
      {
        method: 'PUT',
      }
    );
    if (!res.ok) {
      throw new Error('Failed to update question status');
    }
    return res.json();
  } catch (error) {
    console.error('Error updating question:', error);
  }
}

const SectionQuestion = () => {
  const [activeTab, setActiveTab] = useState('allQuestions');
  const [questions, setQuestions] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const getQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getQuestions();
  }, []);

  const handleSlideChange = async (swiper) => {
    const newIndex = swiper.activeIndex;

    const currentQuestion = questions[activeTab]?.[newIndex];
    if (
      currentQuestion &&
      !currentQuestion.isReadByUser &&
      currentQuestion.isAnswered
    ) {
      await markQuestionAsRead(currentQuestion.id);

      setQuestions((prevQuestions) => ({
        ...prevQuestions,
        [activeTab]: prevQuestions[activeTab].map((q) =>
          q.id === currentQuestion.id ? { ...q, isReadByUser: true } : q
        ),
      }));
    }
  };

  useEffect(() => {
    const checkFirstItem = async () => {
      const currentQuestion = questions[activeTab]?.[0];
      if (
        currentQuestion &&
        !currentQuestion.isReadByUser &&
        currentQuestion.isAnswered
      ) {
        await markQuestionAsRead(currentQuestion.id);

        setQuestions((prevQuestions) => ({
          ...prevQuestions,
          [activeTab]: prevQuestions[activeTab].map((q) =>
            q.id === currentQuestion.id ? { ...q, isReadByUser: true } : q
          ),
        }));
      }
    };

    checkFirstItem();
  }, [questions, activeTab]);

  const currentCount = questions[activeTab]?.length || 0;

  return (
    <div>
      <div className='grid grid-cols-2 gap-2 rounded-[20px] border border-black/5 bg-background-light/45 p-1.5 dark:border-white/10 dark:bg-background-dark/30'>
        <button
          type='button'
          onClick={() => setActiveTab('allQuestions')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-[11px] font-black transition-all sm:text-xs ${
            activeTab === 'allQuestions'
              ? 'bg-secondary text-white shadow-[0_10px_25px_rgba(38,145,125,0.18)]'
              : 'text-subtext-light hover:bg-surface-light/60 hover:text-text-light dark:text-subtext-dark dark:hover:bg-surface-dark/50 dark:hover:text-text-dark'
          }`}
        >
          <HiOutlineChatBubbleLeftRight size={17} />
          همه سوالات
        </button>

        <button
          type='button'
          onClick={() => setActiveTab('unansweredQuestions')}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-[11px] font-black transition-all sm:text-xs ${
            activeTab === 'unansweredQuestions'
              ? 'bg-secondary text-white shadow-[0_10px_25px_rgba(38,145,125,0.18)]'
              : 'text-subtext-light hover:bg-surface-light/60 hover:text-text-light dark:text-subtext-dark dark:hover:bg-surface-dark/50 dark:hover:text-text-dark'
          }`}
        >
          <HiOutlineQuestionMarkCircle size={17} />
          پاسخ داده نشده
        </button>
      </div>

      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        className='mt-4 overflow-hidden p-3 sm:p-4'
      >
        {isLoading ? (
          <div className='flex min-h-[340px] w-full flex-col items-center justify-center gap-3'>
            <ImSpinner2 size={34} className='animate-spin text-secondary' />
            <span className='text-xs text-subtext-light dark:text-subtext-dark'>
              در حال دریافت سوالات...
            </span>
          </div>
        ) : currentCount === 0 ? (
          <div className='flex min-h-[340px] w-full flex-col items-center justify-center gap-3 text-center'>
            <span className='flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
              <HiOutlineQuestionMarkCircle size={30} />
            </span>
            <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
              سوالی در این بخش وجود ندارد
            </h3>
            <p className='max-w-sm text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
              سوال‌هایی که در دوره‌ها ثبت کرده‌اید از این قسمت قابل مشاهده و
              پیگیری هستند.
            </p>
          </div>
        ) : (
          <Swiper
            dir='rtl'
            pagination={{ dynamicBullets: true }}
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView={1}
            onSlideChange={handleSlideChange}
            className='profile-questions-swiper'
          >
            {questions[activeTab]?.map((question) => (
              <SwiperSlide key={question.id}>
                <QuestionSliderItem question={question} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </SiteCard>
    </div>
  );
};

export default SectionQuestion;
