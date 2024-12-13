import React from 'react';
import Logo from '../Logo/Logo';
import Link from 'next/link';
import IconButton from '../Ui/ButtonIcon/ButtonIcon';
import { AiOutlineInstagram } from 'react-icons/ai';
import { LiaTelegram } from 'react-icons/lia';
import { AiOutlineYoutube } from 'react-icons/ai';
import LicenseCard from './LicenseCard';
import { getYear } from '@/utils/dateTimeHelper';

export default function Footer() {
  return (
    <footer className='bg-surface-light dark:bg-surface-dark'>
      <div className='container flex flex-col items-center'>
        <div className='grid grid-cols-1 items-baseline gap-8 py-10 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5'>
          <div className='col-span-1 mb-4 flex flex-col items-start xs:col-span-2 sm:col-span-3 md:col-span-2 md:mb-0'>
            <Logo />
            <p className='mt-4 text-sm text-text-light dark:text-text-dark'>
              {' '}
              {/*TODO: Add dynamic text */}
              لورم ایپسوم متن ساختگی با تولید سادگی لورم ایپسوم متن ساختگی با
              تولید سادگی نامفهوم از صنعت چاپ است. نامفهوم از صنعت چاپ است.
            </p>

            <div className='mt-6 flex items-center gap-4'>
              <IconButton icon={AiOutlineInstagram} size={30} />{' '}
              {/*TODO: Add link */}
              <IconButton icon={LiaTelegram} size={30} />
              <IconButton icon={AiOutlineYoutube} size={30} />
            </div>
          </div>
          {/* Second section: Links category 1 */}
          <div className='mb-4 flex flex-col gap-3 md:mb-0'>
            <h4 className='mb-2 font-semibold text-text-light dark:text-text-dark'>
              دوره‌ها
            </h4>{' '}
            {/*TODO: Add dynamic links */}
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              دوره جامع یوگا
            </Link>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              دوره مبتدی یوگا
            </Link>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              دوره جامع تنفس
            </Link>
          </div>

          {/* Third section: Links category 2 */}
          <div className='mb-4 flex flex-col gap-3 md:mb-0'>
            <h4 className='mb-2 font-semibold text-text-light dark:text-text-dark'>
              مقالات
            </h4>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              ارتباط یوگا و مدیتیشن
            </Link>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              بررسی حرکات ذهن آگاهانه
            </Link>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              فواید یوگا و مدیتیشن برای سلامت روان
            </Link>
          </div>

          {/* Fourth section: Links category 3 */}
          <div className='flex flex-col gap-3'>
            <h4 className='mb-2 font-semibold text-text-light dark:text-text-dark'>
              لینک‌های مفید
            </h4>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              ثبت نام در سایت
            </Link>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              بلاگ و مقالات
            </Link>
            <Link
              href='/'
              className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
            >
              قوانین و مقررات
            </Link>
          </div>
        </div>
        <div className='mt-4 flex items-center gap-4'>
          <LicenseCard licenseLogo='/images/javaz.png' />
          <LicenseCard licenseLogo='/images/javaz.png' />
          <LicenseCard licenseLogo='/images/javaz.png' />
        </div>
        <p className='my-10 text-xs text-subtext-light dark:text-subtext-dark'>
          ©{getYear()} تمامی حقوق برای سمانه یوگا محفوظ است.
        </p>
      </div>
    </footer>
  );
}
