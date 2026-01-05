'use client';
import React, { useEffect, useState } from 'react';
import SectionEditProfile from './SectionEditProfile';
import SectionCourse from './SectionCourse';
import SectionQuestion from './SectionQuestion';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';
import SectionPaymentOrder from './SectionPaymentOrder';
import SectionTicket from './SectionTicket';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import SectionShopOrders from './SectionShopOrders';

const ProfileMainBox = ({ status }) => {
  const { user } = useAuthUser();
  const router = useRouter();
  const [questionsCount, setQuestionsCount] = useState(0);

  useEffect(() => {
    const fetchUnreadQuestions = async () => {
      try {
        const res = await fetch('/api/questions/unread-count');
        if (!res.ok) throw new Error('Failed to fetch unread questions count');
        const data = await res.json();
        setQuestionsCount(data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread questions:', error);
      }
    };

    fetchUnreadQuestions();
  }, []);

  const coursesCount = user?.courses?.length || 0;
  const [shopOrdersTotal, setShopOrdersTotal] = useState(0);

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (status >= 0 && status <= 5) setActiveIndex(status);
  }, [status]);

  const profileItems = [
    { name: 'دوره ها', statusNumber: coursesCount },
    { name: 'سفارشات', statusNumber: shopOrdersTotal },
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
    <div className='my-7 h-full w-full rounded-xl bg-surface-light lg:my-14 dark:bg-surface-dark'>
      <div className='flex w-full flex-col lg:flex-row'>
        <nav
          className={`hide-scrollbar flex gap-0 overflow-x-auto border-b border-gray-300 px-4 py-3 sm:gap-3 lg:sticky lg:top-24 lg:w-36 lg:shrink-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:border-l lg:px-1 lg:py-6 xl:w-48 dark:border-gray-600`}
          aria-label='Profile navigation'
        >
          {profileItems.map((item, index) => {
            const isActive = activeIndex === index;

            return (
              <button
                key={index}
                onClick={() => handleButtonClick(index)}
                className={`relative flex items-center justify-between whitespace-nowrap rounded-xl px-3 py-2 text-right text-xs transition-all hover:text-secondary lg:w-full lg:px-3 lg:py-2.5 lg:text-sm ${
                  isActive ? 'bg-secondary/10 text-secondary' : ''
                } `}
              >
                <span className='flex items-center gap-2'>
                  {/* indicator فقط برای حالت سایدبار بهتر دیده میشه */}
                  <span
                    className={`hidden h-1.5 w-1.5 rounded-full lg:inline-block ${
                      isActive ? 'bg-secondary' : 'bg-transparent'
                    }`}
                  />
                  {item.name}
                </span>

                {item.statusNumber > 0 && (
                  <span className='mr-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red px-1 text-[11px] text-white lg:mr-3 lg:h-6 lg:min-w-[24px] lg:text-xs'>
                    <span className='font-faNa'>
                      {Number(item.statusNumber).toLocaleString('fa-IR')}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ✅ CONTENT: min-w-0 برای جلوگیری از کشیدگی روی nav */}
        <main className='min-w-0 flex-1 p-4 lg:p-6'>
          {activeIndex === 0 && <SectionCourse />}

          {activeIndex === 1 && (
            <SectionShopOrders
              onCounts={(payload) => {
                setShopOrdersTotal(Number(payload?.total || 0));
              }}
            />
          )}
          {activeIndex === 2 && <SectionQuestion />}
          {activeIndex === 3 && <SectionPaymentOrder />}
          {activeIndex === 4 && <SectionTicket />}
          {activeIndex === 5 && <SectionEditProfile />}
        </main>
      </div>
    </div>
  );
};

ProfileMainBox.propTypes = {
  status: PropTypes.number,
};

export default ProfileMainBox;
