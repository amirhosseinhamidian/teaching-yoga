import React from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import Image from 'next/image';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import Link from 'next/link';

export async function generateMetadata() {
  return {
    title: 'صفحه ای یافت نشد!',
    robots: 'noindex, nofollow',
  };
}

async function NotFound() {
  return (
    <div>
      <Header />
      <div className='flex flex-col gap-6 py-16'>
        <div className='flex flex-wrap items-center justify-center gap-4'>
          <h1 className='font-faNa text-4xl font-bold opacity-30 xs:text-6xl sm:text-7xl'>
            404
          </h1>
          <Image
            src='/images/not-found.jpg'
            alt='not-found'
            width={200}
            height={200}
            className='rounded-full opacity-65'
          />
        </div>
        <h2 className='text-center text-lg opacity-30 sm:text-2xl'>
          صفحه ای یافت نشد!
        </h2>
        <div className='flex flex-wrap items-center justify-center gap-4'>
          <Link href='/'>
            <OutlineButton color='subtext'>خانه</OutlineButton>
          </Link>
          <Link href='/courses'>
            <OutlineButton color='subtext'>مشاهده دوره ها</OutlineButton>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NotFound;
