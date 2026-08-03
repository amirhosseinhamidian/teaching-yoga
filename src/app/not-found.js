import Footer from '@/components/Footer/Footer';
import HeaderWrapper from '@/components/Header/HeaderWrapper';
import ErrorState from '@/components/templates/error-state/ErrorState';
import React from 'react';

export const metadata = {
  title: 'صفحه پیدا نشد | سمانه یوگا',
  description: 'صفحه‌ای که به دنبال آن هستید پیدا نشد.',
  robots: {
    index: false,
    follow: false,
  },
};

const NotFound = () => {
  return (
    <>
      <HeaderWrapper />

      <ErrorState
        code='404'
        variant='notFound'
        eyebrow='مسیر پیدا نشد'
        title='به نظر می‌رسد این صفحه دیگر اینجا نیست'
        description='ممکن است آدرس صفحه تغییر کرده باشد، محتوا حذف شده باشد یا نشانی را اشتباه وارد کرده باشید. از مسیرهای زیر می‌توانید به بخش‌های اصلی سایت برگردید.'
        primaryHref='/'
        primaryLabel='بازگشت به خانه'
        secondaryHref='/courses'
        secondaryLabel='مشاهده دوره‌ها'
      />

      <Footer />
    </>
  );
};

export default NotFound;
