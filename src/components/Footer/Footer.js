/* eslint-disable no-undef */
import React from 'react';
import Logo from '../Logo/Logo';
import Link from 'next/link';

import LicenseCard from './LicenseCard';
import { getYear } from '@/utils/dateTimeHelper';
import Socials from '../modules/Socials/Socials';
import { headers } from 'next/headers';
import { MdOutlineMail } from 'react-icons/md';
import { FiHome } from 'react-icons/fi';
import { LiaPhoneSolid } from 'react-icons/lia';

const fetchFooterData = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info`,
      {
        method: 'GET',
        headers: headers(),
        next: {
          revalidate: 86400, // 1 day
        },
      },
    );
    if (!res.ok) {
      throw new Error('Error to fetch footer data!');
    }
    return await res.json();
  } catch (error) {
    console.error(error);
  }
};

export default async function Footer() {
  const footerData = await fetchFooterData();

  return (
    <footer className='bg-surface-light dark:bg-surface-dark'>
      <div className='container flex flex-col items-center'>
        <div className='grid grid-cols-1 items-baseline gap-8 py-10 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5'>
          <div className='col-span-1 mb-4 flex flex-col items-start xs:col-span-2 sm:col-span-3 md:col-span-2 md:mb-0'>
            <Logo />
            <p className='mt-4 text-sm text-text-light dark:text-text-dark'>
              {footerData.shortDescription}
            </p>

            <Socials size={30} socialLinks={footerData.socialLinks} />

            <div className='mt-4 flex items-center gap-2 text-lg text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'>
              <MdOutlineMail size={24} />
              <a
                href={`mailto:${footerData.companyEmail}`}
                aria-label='ارسال ایمیل'
                className=''
              >
                {footerData.companyEmail}
              </a>
            </div>
            {footerData?.companyPhone && (
              <div className='mt-1 flex items-center gap-2 text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'>
                <LiaPhoneSolid size={24} />
                <a
                  href={`tel:${footerData.companyPhone}`}
                  className='font-faNa'
                >
                  {footerData.companyPhone}
                </a>
              </div>
            )}
            {footerData?.companyAddress && (
              <div className='mt-1 flex items-center gap-2 text-subtext-light dark:text-subtext-dark'>
                <FiHome size={24} />
                <p className='font-faNa'>{footerData.companyAddress}</p>
              </div>
            )}
          </div>
          {/* Second section: Links category 1 */}
          {footerData.coursesLinks.length !== 0 && (
            <div className='mb-4 flex flex-col gap-3 md:mb-0'>
              <h4 className='mb-2 font-semibold text-text-light dark:text-text-dark'>
                دوره‌ها
              </h4>
              {footerData.coursesLinks.map((courseLink) => (
                <Link
                  key={courseLink.value}
                  href={courseLink.value}
                  className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
                >
                  {courseLink.label}
                </Link>
              ))}
            </div>
          )}

          {footerData.articlesLinks.length !== 0 && (
            <div className='mb-4 flex flex-col gap-3 md:mb-0'>
              <h4 className='mb-2 font-semibold text-text-light dark:text-text-dark'>
                مقالات
              </h4>
              {footerData.articlesLinks.map((articleLink) => (
                <Link
                  key={articleLink.value}
                  href={`/articles/${articleLink.value}`}
                  className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
                >
                  {articleLink.label}
                </Link>
              ))}
            </div>
          )}

          {footerData.usefulLinks.length !== 0 && (
            <div className='flex flex-col gap-3'>
              <h4 className='mb-2 font-semibold text-text-light dark:text-text-dark'>
                لینک‌های مفید
              </h4>
              {footerData.usefulLinks.map((usefulLink) => (
                <Link
                  key={usefulLink.value}
                  href={usefulLink.value}
                  className='text-sm text-subtext-light transition-all duration-200 ease-in hover:text-secondary dark:text-subtext-dark'
                >
                  {usefulLink.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className='mt-4 flex items-center gap-4'>
          <LicenseCard
            licenseLogo='https://trustseal.enamad.ir/logo.aspx?id=561226&Code=5i7lbcOCSlvbB2Bbsejbsx57LJOweheK'
            title='اینماد'
            path='https://trustseal.enamad.ir/?id=561226&Code=5i7lbcOCSlvbB2Bbsejbsx57LJOweheK'
          />
        </div>
        <p className='my-10 text-xs text-subtext-light dark:text-subtext-dark'>
          ©{getYear()} تمامی حقوق برای سمانه یوگا محفوظ است.
        </p>
      </div>
    </footer>
  );
}
