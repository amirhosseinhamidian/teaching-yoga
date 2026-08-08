'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';

import SiteCard from '@/components/SiteUi/Card/SiteCard';

import SectionEditProfile from './SectionEditProfile';
import SectionCourse from './SectionCourse';
import SectionQuestion from './SectionQuestion';
import SectionPaymentOrder from './SectionPaymentOrder';
import SectionTicket from './SectionTicket';
import SectionShopOrders from './SectionShopOrders';

import { useAuthUser } from '@/hooks/auth/useAuthUser';

import {
  HiOutlineAcademicCap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCreditCard,
  HiOutlinePencilSquare,
  HiOutlineShoppingBag,
  HiOutlineTicket,
} from 'react-icons/hi2';

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
    {
      name: 'دوره‌ها',
      statusNumber: coursesCount,
      icon: HiOutlineAcademicCap,
      description: 'مسیرهای آموزشی شما',
    },
    {
      name: 'سفارشات',
      statusNumber: shopOrdersTotal,
      icon: HiOutlineShoppingBag,
      description: 'پیگیری خریدهای فروشگاه',
    },
    {
      name: 'سوالات',
      statusNumber: questionsCount,
      icon: HiOutlineChatBubbleLeftRight,
      description: 'پرسش‌های دوره‌ها',
    },
    {
      name: 'سوابق خرید',
      statusNumber: 0,
      icon: HiOutlineCreditCard,
      description: 'پرداخت‌ها و تراکنش‌ها',
    },
    {
      name: 'تیکت',
      statusNumber: 0,
      icon: HiOutlineTicket,
      description: 'ارتباط با پشتیبانی',
    },
    {
      name: 'ویرایش پروفایل',
      statusNumber: 0,
      icon: HiOutlinePencilSquare,
      description: 'اطلاعات حساب کاربری',
    },
  ];

  const handleButtonClick = (index) => {
    setActiveIndex(index);

    router.replace(`?active=${index}`, {
      scroll: false,
    });
  };

  const activeItem = profileItems[activeIndex];

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className='relative mt-5 overflow-hidden sm:mt-6'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -left-24 top-1/3 h-60 w-60 rounded-full bg-secondary/[0.07] blur-[90px]'
      />

      <div className='relative z-10 flex min-w-0 flex-col lg:min-h-[620px] lg:flex-row'>
        <nav
          className='hide-scrollbar flex shrink-0 gap-2 overflow-x-auto border-b border-black/5 bg-background-light/30 p-3 lg:sticky lg:top-24 lg:h-fit lg:w-[230px] lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-l lg:p-4 dark:border-white/10 dark:bg-background-dark/20'
          aria-label='Profile navigation'
        >
          {profileItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeIndex === index;

            return (
              <button
                key={index}
                type='button'
                onClick={() => handleButtonClick(index)}
                className={`group relative flex min-w-fit items-center gap-2.5 whitespace-nowrap rounded-2xl border px-3 py-2.5 text-right transition-all duration-200 lg:w-full lg:min-w-0 lg:px-3.5 lg:py-3 ${
                  isActive
                    ? 'border-secondary/20 bg-secondary/10 text-secondary shadow-[0_10px_28px_rgba(38,145,125,0.08)]'
                    : 'border-transparent text-subtext-light hover:border-black/5 hover:bg-surface-light/55 hover:text-text-light dark:text-subtext-dark dark:hover:border-white/10 dark:hover:bg-surface-dark/45 dark:hover:text-text-dark'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-secondary text-white'
                      : 'bg-black/[0.035] text-subtext-light group-hover:bg-secondary/10 group-hover:text-secondary dark:bg-white/[0.05] dark:text-subtext-dark'
                  }`}
                >
                  <Icon size={18} />
                </span>

                <span className='min-w-0 lg:flex-1'>
                  <span className='block text-[11px] font-black sm:text-xs lg:text-sm'>
                    {item.name}
                  </span>

                  <span className='mt-0.5 hidden truncate text-[9px] font-medium opacity-65 lg:block'>
                    {item.description}
                  </span>
                </span>

                {item.statusNumber > 0 && (
                  <span
                    className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 font-faNa text-[9px] font-black ${
                      isActive ? 'bg-secondary text-white' : 'bg-red text-white'
                    }`}
                  >
                    {Number(item.statusNumber).toLocaleString('fa-IR')}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <main className='min-w-0 flex-1 p-4 sm:p-5 lg:p-6'>
          <div className='mb-5 border-b border-black/5 pb-4 dark:border-white/10'>
            <p className='text-[10px] font-bold text-secondary'>حساب کاربری</p>
            <h2 className='mt-1 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
              {activeItem?.name}
            </h2>
            <p className='mt-1 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
              {activeItem?.description}
            </p>
          </div>

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
    </SiteCard>
  );
};

ProfileMainBox.propTypes = {
  status: PropTypes.number,
};

export default ProfileMainBox;
