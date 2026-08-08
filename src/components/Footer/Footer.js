/* eslint-disable no-undef */

import React from 'react';
import Link from 'next/link';

import Logo from '../Logo/Logo';
import LicenseCard from './LicenseCard';
import Socials from '../modules/Socials/Socials';

import { getYear } from '@/utils/dateTimeHelper';

import { MdOutlineMail } from 'react-icons/md';
import { FiHome } from 'react-icons/fi';
import { LiaPhoneSolid } from 'react-icons/lia';

import {
  HiOutlineArrowLeft,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const fetchFooterData = async () => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

    if (!apiBaseUrl) {
      console.error(
        '[FOOTER_DATA_FETCH_ERROR] NEXT_PUBLIC_API_BASE_URL is not defined'
      );

      return null;
    }

    const response = await fetch(`${apiBaseUrl}/api/site-info`, {
      method: 'GET',
      next: {
        revalidate: 86400,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch footer data: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[FOOTER_DATA_FETCH_ERROR]', error);

    return null;
  }
};

const FooterLinkColumn = ({ title, links, type = 'default' }) => {
  if (!Array.isArray(links) || links.length === 0) {
    return null;
  }

  const resolveHref = (link) => {
    if (!link?.value) {
      return '#';
    }

    if (type === 'article') {
      return `/articles/${link.value}`;
    }

    return link.value;
  };

  return (
    <div>
      <div className='mb-5 flex items-center gap-2'>
        <span className='h-2 w-2 rounded-full bg-secondary shadow-[0_0_14px_rgba(38,145,125,0.65)]' />

        <h3 className='text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
          {title}
        </h3>
      </div>

      <nav aria-label={title} className='flex flex-col items-start gap-3'>
        {links.map((link) => (
          <Link
            key={`${title}-${link.value}`}
            href={resolveHref(link)}
            className='group inline-flex items-center gap-2 text-sm leading-7 text-subtext-light transition-colors duration-300 hover:text-secondary dark:text-subtext-dark'
          >
            <HiOutlineArrowLeft
              size={15}
              className='shrink-0 opacity-40 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100'
            />

            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const Footer = async () => {
  const footerData = await fetchFooterData();

  const coursesLinks = Array.isArray(footerData?.coursesLinks)
    ? footerData.coursesLinks
    : [];

  const articlesLinks = Array.isArray(footerData?.articlesLinks)
    ? footerData.articlesLinks
    : [];

  const usefulLinks = Array.isArray(footerData?.usefulLinks)
    ? footerData.usefulLinks
    : [];

  const companyEmail = footerData?.companyEmail || '';
  const companyPhone = footerData?.companyPhone || '';
  const companyAddress = footerData?.companyAddress || '';

  return (
    <footer
      dir='rtl'
      className='relative isolate overflow-hidden border-t border-black/5 bg-surface-light transition-colors duration-300 dark:border-white/10 dark:bg-surface-dark'
    >
      {/* Background decorations */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <div className='absolute -right-48 top-0 h-[470px] w-[470px] rounded-full bg-secondary/10 blur-[150px]' />

        <div className='bg-yellow/10 dark:bg-yellow/5 absolute -left-48 bottom-0 h-[440px] w-[440px] rounded-full blur-[150px]' />

        <div className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/50 to-transparent' />

        <div
          className='absolute inset-0 opacity-[0.025] dark:opacity-[0.04]'
          style={{
            backgroundImage:
              'linear-gradient(rgba(100, 244, 171, 0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 244, 171, 0.22) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
          }}
        />

        <div className='absolute -right-28 bottom-20 h-72 w-72 rounded-full border border-dashed border-secondary/10' />

        <div className='border-yellow/10 absolute -left-24 top-20 h-64 w-64 rounded-full border border-dashed' />
      </div>

      <div className='container mx-auto px-4 pb-7 pt-14 sm:px-6 sm:pt-16 lg:pt-20'>
        {/* Main footer card */}
        <div className='relative overflow-hidden rounded-[32px] border border-black/5 bg-background-light/65 px-5 py-8 shadow-[0_25px_80px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:rounded-[40px] sm:px-8 sm:py-10 lg:px-10 lg:py-12 dark:border-white/10 dark:bg-background-dark/45 dark:shadow-[0_30px_90px_rgba(0,0,0,0.25)]'>
          <div
            aria-hidden='true'
            className='absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent'
          />

          <div
            aria-hidden='true'
            className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/10 absolute -bottom-32 left-[25%] h-72 w-72 rounded-full blur-[110px]'
          />

          <div className='relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:gap-16'>
            {/* Brand and contact */}
            <div>
              <div className='max-w-2xl'>
                <Logo />

                <div className='mt-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary'>
                  <HiOutlineSparkles size={17} />

                  <span>مسیر آرامش، آگاهی و زندگی متعادل</span>
                </div>

                {footerData?.shortDescription && (
                  <p className='mt-5 max-w-xl text-sm leading-8 text-subtext-light sm:text-base sm:leading-9 dark:text-subtext-dark'>
                    {footerData.shortDescription}
                  </p>
                )}
              </div>

              {/* Contact cards */}
              <div className='mt-7 grid gap-3 sm:grid-cols-2'>
                {companyEmail && (
                  <a
                    href={`mailto:${companyEmail}`}
                    aria-label='ارسال ایمیل'
                    className='group flex min-w-0 items-center gap-3 rounded-2xl border border-black/5 bg-surface-light/65 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-[0_15px_35px_rgba(38,145,125,0.08)] dark:border-white/10 dark:bg-surface-dark/55'
                  >
                    <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-white'>
                      <MdOutlineMail size={23} />
                    </span>

                    <span className='min-w-0 text-right'>
                      <span className='block text-[11px] text-subtext-light dark:text-subtext-dark'>
                        ایمیل
                      </span>

                      <span
                        dir='ltr'
                        className='mt-1 block truncate text-sm font-medium text-text-light transition-colors group-hover:text-secondary dark:text-text-dark'
                      >
                        {companyEmail}
                      </span>
                    </span>
                  </a>
                )}

                {companyPhone && (
                  <a
                    href={`tel:${companyPhone}`}
                    aria-label='تماس تلفنی'
                    className='group flex min-w-0 items-center gap-3 rounded-2xl border border-black/5 bg-surface-light/65 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-[0_15px_35px_rgba(38,145,125,0.08)] dark:border-white/10 dark:bg-surface-dark/55'
                  >
                    <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary transition-colors duration-300 group-hover:bg-secondary group-hover:text-white'>
                      <LiaPhoneSolid size={24} />
                    </span>

                    <span className='min-w-0 text-right'>
                      <span className='block text-[11px] text-subtext-light dark:text-subtext-dark'>
                        شماره تماس
                      </span>

                      <span
                        dir='ltr'
                        className='mt-1 block font-faNa text-sm font-medium text-text-light transition-colors group-hover:text-secondary dark:text-text-dark'
                      >
                        {companyPhone}
                      </span>
                    </span>
                  </a>
                )}
              </div>

              {companyAddress && (
                <div className='mt-3 flex items-start gap-3 rounded-2xl border border-black/5 bg-surface-light/45 p-4 dark:border-white/10 dark:bg-surface-dark/45'>
                  <span className='bg-yellow/10 text-yellow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl'>
                    <FiHome size={21} />
                  </span>

                  <div>
                    <span className='block text-[11px] text-subtext-light dark:text-subtext-dark'>
                      نشانی
                    </span>

                    <p className='mt-1 font-faNa text-sm leading-7 text-text-light dark:text-text-dark'>
                      {companyAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* Socials */}
              <div className='mt-6'>
                <p className='mb-3 text-xs font-bold text-subtext-light dark:text-subtext-dark'>
                  سمانه یوگا در شبکه‌های اجتماعی
                </p>

                <Socials size={28} socialLinks={footerData?.socialLinks} />
              </div>
            </div>

            {/* Navigation */}
            <div className='relative'>
              <div className='mb-7 flex items-center gap-3'>
                <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                  <HiOutlineBookOpen size={23} />
                </span>

                <div>
                  <h2 className='font-black text-text-light dark:text-text-dark'>
                    دسترسی سریع
                  </h2>

                  <p className='mt-1 text-xs text-subtext-light dark:text-subtext-dark'>
                    مسیر موردنظرت را سریع‌تر پیدا کن
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3'>
                <FooterLinkColumn title='دوره‌ها' links={coursesLinks} />

                <FooterLinkColumn
                  title='مقالات'
                  links={articlesLinks}
                  type='article'
                />

                <FooterLinkColumn title='لینک‌های مفید' links={usefulLinks} />
              </div>

              <div className='mt-9 rounded-[24px] border border-secondary/15 bg-secondary/5 p-5 dark:bg-secondary/10'>
                <div className='flex items-start gap-3'>
                  <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                    <HiOutlineCheckBadge size={22} />
                  </span>

                  <div>
                    <h3 className='text-sm font-black text-text-light dark:text-text-dark'>
                      شروع تمرین از سطح مناسب
                    </h3>

                    <p className='mt-2 text-xs leading-7 text-subtext-light dark:text-subtext-dark'>
                      با مشاهده دوره‌ها، مسیر مناسب سطح و هدف خودت را انتخاب کن.
                    </p>

                    <Link
                      href='/courses'
                      className='group mt-3 inline-flex items-center gap-2 text-xs font-bold text-secondary'
                    >
                      <span>مشاهده دوره‌ها</span>

                      <HiOutlineArrowLeft
                        size={16}
                        className='transition-transform duration-300 group-hover:-translate-x-1'
                      />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* License section */}
          <div className='relative z-10 mt-10 border-t border-black/5 pt-7 dark:border-white/10'>
            <div className='flex flex-col items-center justify-between gap-5 sm:flex-row'>
              <div>
                <h3 className='text-center text-sm font-black text-text-light sm:text-right dark:text-text-dark'>
                  مجوزها و اعتبار سامانه
                </h3>

                <p className='mt-1 text-center text-xs leading-6 text-subtext-light sm:text-right dark:text-subtext-dark'>
                  برای مشاهده و اعتبارسنجی مجوز روی نشان کلیک کنید.
                </p>
              </div>

              <LicenseCard
                licenseLogo='/images/enamad.png'
                title='اینماد'
                path='https://trustseal.enamad.ir/?id=561226&Code=5i7lbcOCSlvbB2Bbsejbsx57LJOweheK'
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className='mt-6 flex flex-col items-center justify-between gap-3 border-t border-black/5 px-2 pt-6 text-center sm:flex-row sm:text-right dark:border-white/10'>
          <p className='text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
            ©<span className='mx-1 font-faNa'>{getYear()}</span>
            تمامی حقوق برای سمانه یوگا محفوظ است.
          </p>

          <div className='flex items-center gap-2 text-xs text-subtext-light dark:text-subtext-dark'>
            <span>ساخته‌شده با</span>

            <span aria-label='عشق' className='text-secondary'>
              ♥
            </span>

            <span>برای مسیر آگاهی و آرامش</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
