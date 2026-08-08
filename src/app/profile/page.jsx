import React from 'react';

import ProfileHead from '@/components/templates/profile/ProfileHead';
import ProfileMainBox from '@/components/templates/profile/ProfileMainBox';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import PageIntro from '@/components/SiteUi/PageIntro/PageIntro';

import { HiOutlineUserCircle } from 'react-icons/hi2';

const page = async ({ searchParams }) => {
  const activeStatus = parseInt(searchParams?.active || '0', 10);

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-screen overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      <div className='container relative z-10 mx-auto px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:pb-24'>
        <PageIntro
          eyebrow='حساب کاربری'
          title='مدیریت مسیر آموزشی و'
          highlight='فعالیت‌های شما'
          description='دوره‌ها، سفارش‌ها، پرسش‌ها، پرداخت‌ها و اطلاعات حساب کاربری خود را از یک فضای منظم و یکپارچه مدیریت کنید.'
          visualIcon={HiOutlineUserCircle}
          variant='compact'
        />

        <ProfileHead />
        <ProfileMainBox status={activeStatus} />
      </div>
    </main>
  );
};

export default page;
