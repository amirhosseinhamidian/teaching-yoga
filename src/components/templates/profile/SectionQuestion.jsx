/* eslint-disable no-undef */
'use client';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react'; // Swiper
import 'swiper/css';
import 'swiper/css/pagination';
import QuestionSliderItem from './QuestionSliderItem';
import { Pagination } from 'swiper/modules';
import { ImSpinner2 } from 'react-icons/im';
import { PiEmptyLight } from 'react-icons/pi';

async function fetchQuestions() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questions`,
      {
        cache: 'no-store', // Ensures SSR by disabling caching
        method: 'GET',
      },
    );

    // اگر پاسخ از سرور موفقیت‌آمیز نبود، خطا پرتاب می‌شود
    if (!res.ok) {
      throw new Error('Failed to fetch course data');
    }

    // بازگشت داده‌ها در صورتی که درخواست موفقیت‌آمیز باشد
    return res.json();
  } catch (error) {
    // در صورت بروز هرگونه خطا، پیام خطا در کنسول ثبت می‌شود
    console.error('Error fetching data:', error);
  }
}

async function markQuestionAsRead(questionId) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/questions/${questionId}`,
      {
        method: 'PUT',
      },
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

      // به‌روزرسانی وضعیت در آرایه محلی
      setQuestions((prevQuestions) => ({
        ...prevQuestions,
        [activeTab]: prevQuestions[activeTab].map((q) =>
          q.id === currentQuestion.id ? { ...q, isReadByUser: true } : q,
        ),
      }));
    }
  };

  return (
    <div>
      {/* تب‌ها */}
      <div className='grid grid-cols-3 rounded-xl bg-foreground-light dark:bg-foreground-dark'>
        <button
          onClick={() => setActiveTab('allQuestions')}
          className={`px-1 py-2 text-xs font-semibold xs:text-sm sm:px-4 md:text-base ${activeTab === 'allQuestions' ? 'rounded-xl bg-secondary text-text-light' : 'text-subtext-light dark:text-subtext-dark'}`}
        >
          همه سوالات
        </button>
        <button
          onClick={() => setActiveTab('unreadQuestions')}
          className={`px-1 py-2 text-xs font-semibold xs:text-sm sm:px-4 md:text-base ${activeTab === 'unreadQuestions' ? 'rounded-xl bg-secondary text-text-light' : 'text-subtext-light dark:text-subtext-dark'}`}
        >
          خوانده نشده
        </button>
        <button
          onClick={() => setActiveTab('unansweredQuestions')}
          className={`px-1 py-2 text-xs font-semibold xs:text-sm sm:px-4 md:text-base ${activeTab === 'unansweredQuestions' ? 'rounded-xl bg-secondary text-text-light' : 'text-subtext-light dark:text-subtext-dark'}`}
        >
          پاسخ داده نشده
        </button>
      </div>

      {/* اسلایدر */}
      <div className='my-6 max-w-[368px] rounded-xl border border-accent p-2 md:max-w-[488px] md:p-4 lg:max-w-[748px] xl:max-w-[996px] 2xl:max-w-[1240px]'>
        {isLoading ? (
          <div className='flex min-h-64 w-full items-center justify-center'>
            <ImSpinner2 size={42} className='animate-spin text-secondary' />
          </div>
        ) : (
          <>
            {questions[activeTab]?.length === 0 ? (
              <div className='flex min-h-64 w-full flex-col items-center justify-center gap-4'>
                <PiEmptyLight
                  size={46}
                  className='text-subtext-light dark:text-subtext-dark'
                />
                <span className='text-subtext-light dark:text-subtext-dark'>
                  سوالی در این بخش وجود ندارد.
                </span>
              </div>
            ) : (
              <Swiper
                dir='rtl'
                pagination={{
                  dynamicBullets: true,
                }}
                modules={[Pagination]}
                spaceBetween={14}
                slidesPerView={1}
                onSlideChange={handleSlideChange}
              >
                {questions[activeTab]?.map((question) => (
                  <SwiperSlide key={question.id}>
                    <QuestionSliderItem question={question} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SectionQuestion;
