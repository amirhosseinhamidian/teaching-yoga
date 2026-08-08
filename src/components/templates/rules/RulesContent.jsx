'use client';

import React from 'react';
import PropTypes from 'prop-types';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineCheckBadge,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineScale,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const RulesContent = ({ rules }) => {
  return (
    <div className='container relative z-10 mx-auto px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-7 lg:pb-24'>
      {/* =========================
          Intro
      ========================== */}
      <SiteCard
        as='header'
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className='relative overflow-hidden px-5 py-7 text-center sm:px-8 sm:py-9 lg:px-10 lg:py-10'
      >
        {/* Decorations */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
        />

        <div
          aria-hidden='true'
          className='bg-yellow/10 pointer-events-none absolute -bottom-28 -left-20 h-60 w-60 rounded-full blur-[95px]'
        />

        <div
          aria-hidden='true'
          className='pointer-events-none absolute left-1/2 top-0 h-px w-3/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/50 to-transparent'
        />

        <div className='relative z-10 mx-auto flex max-w-3xl flex-col items-center'>
          {/* Icon */}
          <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] border border-secondary/15 bg-secondary/10 text-secondary shadow-[0_12px_35px_rgba(38,145,125,0.12)] sm:h-16 sm:w-16'>
            <HiOutlineScale size={30} />
          </div>

          <SiteBadge variant='secondary' size='sm'>
            <span className='flex items-center gap-1.5'>
              <HiOutlineSparkles size={14} />
              شفافیت و احترام متقابل
            </span>
          </SiteBadge>

          <h1 className='mt-4 text-2xl font-black leading-[1.8] text-text-light sm:text-3xl lg:text-[34px] dark:text-text-dark'>
            قوانین و مقررات سمانه یوگا
          </h1>

          <p className='mt-3 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
            لطفاً پیش از استفاده از خدمات، دوره‌ها و امکانات سمانه یوگا، این
            موارد را مطالعه کنید.
          </p>

          {/* Small info row */}
          <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
            <span className='inline-flex min-h-9 items-center gap-2 rounded-xl border border-black/5 bg-background-light/55 px-3 text-[10px] font-medium text-subtext-light dark:border-white/10 dark:bg-background-dark/40 dark:text-subtext-dark'>
              <HiOutlineDocumentText size={15} className='text-secondary' />
              شرایط استفاده از خدمات
            </span>

            <span className='inline-flex min-h-9 items-center gap-2 rounded-xl border border-black/5 bg-background-light/55 px-3 text-[10px] font-medium text-subtext-light dark:border-white/10 dark:bg-background-dark/40 dark:text-subtext-dark'>
              <HiOutlineCheckBadge size={15} className='text-secondary' />
              حقوق و مسئولیت کاربران
            </span>
          </div>
        </div>
      </SiteCard>

      {/* =========================
          Rules Body
      ========================== */}
      <div className='mx-auto mt-5 max-w-5xl sm:mt-6'>
        <SiteCard
          as='article'
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='relative overflow-hidden px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-10'
        >
          {/* Decorative glow */}
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -right-32 top-16 h-64 w-64 rounded-full bg-secondary/[0.055] blur-[100px]'
          />

          <div
            aria-hidden='true'
            className='bg-yellow/[0.055] pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full blur-[100px]'
          />

          {/* Content header */}
          <div className='relative z-10 mb-6 flex items-start gap-3 border-b border-black/5 pb-5 sm:mb-8 dark:border-white/10'>
            <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineInformationCircle size={22} />
            </span>

            <div>
              <p className='text-[10px] font-bold text-secondary sm:text-xs'>
                شرایط استفاده
              </p>

              <h2 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                آنچه لازم است بدانید
              </h2>
            </div>
          </div>

          {/* HTML Rules */}
          {rules?.trim() ? (
            <div
              className={[
                'rules-content',
                'relative z-10',
                'min-w-0',
                'break-words',

                /*
                 * Base
                 */
                'text-sm',
                'leading-8',
                'text-subtext-light',

                'sm:text-[15px]',
                'sm:leading-9',

                'lg:text-base',
                'lg:leading-10',

                'dark:text-subtext-dark',

                /*
                 * Paragraphs
                 */
                '[&_p]:my-4',
                'sm:[&_p]:my-5',

                /*
                 * H1
                 */
                '[&_h1]:mb-4',
                '[&_h1]:mt-9',
                '[&_h1]:text-xl',
                '[&_h1]:font-black',
                '[&_h1]:leading-9',
                '[&_h1]:text-text-light',

                'sm:[&_h1]:text-2xl',

                'dark:[&_h1]:text-text-dark',

                /*
                 * H2
                 */
                '[&_h2]:relative',
                '[&_h2]:mb-4',
                '[&_h2]:mt-9',
                '[&_h2]:border-r-[3px]',
                '[&_h2]:border-secondary',
                '[&_h2]:pr-4',
                '[&_h2]:text-lg',
                '[&_h2]:font-black',
                '[&_h2]:leading-8',
                '[&_h2]:text-text-light',

                'sm:[&_h2]:text-xl',

                'dark:[&_h2]:text-text-dark',

                /*
                 * H3
                 */
                '[&_h3]:mb-3',
                '[&_h3]:mt-7',
                '[&_h3]:text-base',
                '[&_h3]:font-black',
                '[&_h3]:leading-8',
                '[&_h3]:text-text-light',

                'sm:[&_h3]:text-lg',

                'dark:[&_h3]:text-text-dark',

                /*
                 * H4+
                 */
                '[&_h4]:mb-2',
                '[&_h4]:mt-6',
                '[&_h4]:font-black',
                '[&_h4]:text-text-light',
                'dark:[&_h4]:text-text-dark',

                /*
                 * Strong
                 */
                '[&_strong]:font-black',
                '[&_strong]:text-text-light',
                'dark:[&_strong]:text-text-dark',

                '[&_b]:font-black',

                /*
                 * Links
                 */
                '[&_a]:font-bold',
                '[&_a]:text-secondary',
                '[&_a]:underline',
                '[&_a]:underline-offset-4',
                '[&_a]:transition-opacity',
                '[&_a:hover]:opacity-75',

                /*
                 * UL
                 */
                '[&_ul]:my-5',
                '[&_ul]:space-y-2',
                '[&_ul]:pr-5',

                /*
                 * OL
                 */
                '[&_ol]:my-5',
                '[&_ol]:list-decimal',
                '[&_ol]:space-y-2',
                '[&_ol]:pr-6',

                /*
                 * Custom list dots
                 */
                '[&_ul>li]:relative',
                '[&_ul>li]:pr-5',
                '[&_ul>li]:before:absolute',
                '[&_ul>li]:before:right-0',
                '[&_ul>li]:before:top-[13px]',
                '[&_ul>li]:before:h-1.5',
                '[&_ul>li]:before:w-1.5',
                '[&_ul>li]:before:rounded-full',
                '[&_ul>li]:before:bg-secondary',

                /*
                 * Quotes
                 */
                '[&_blockquote]:my-6',
                '[&_blockquote]:rounded-2xl',
                '[&_blockquote]:border-r-4',
                '[&_blockquote]:border-secondary',
                '[&_blockquote]:bg-secondary/5',
                '[&_blockquote]:px-5',
                '[&_blockquote]:py-4',
                '[&_blockquote]:font-medium',

                'dark:[&_blockquote]:bg-secondary/10',

                /*
                 * HR
                 */
                '[&_hr]:my-8',
                '[&_hr]:border-black/10',
                'dark:[&_hr]:border-white/10',

                /*
                 * Images
                 */
                '[&_img]:mx-auto',
                '[&_img]:my-7',
                '[&_img]:h-auto',
                '[&_img]:max-w-full',
                '[&_img]:rounded-2xl',

                /*
                 * Tables
                 */
                '[&_table]:my-6',
                '[&_table]:w-full',
                '[&_table]:border-collapse',
                '[&_table]:overflow-hidden',
                '[&_table]:text-xs',

                'sm:[&_table]:text-sm',

                '[&_th]:border',
                '[&_th]:border-black/10',
                '[&_th]:bg-secondary/5',
                '[&_th]:p-3',
                '[&_th]:font-black',
                '[&_th]:text-text-light',

                'dark:[&_th]:border-white/10',
                'dark:[&_th]:bg-secondary/10',
                'dark:[&_th]:text-text-dark',

                '[&_td]:border',
                '[&_td]:border-black/10',
                '[&_td]:p-3',

                'dark:[&_td]:border-white/10',

                /*
                 * Quill alignments
                 */
                '[&_.ql-align-center]:text-center',
                '[&_.ql-align-left]:text-left',
                '[&_.ql-align-right]:text-right',
                '[&_.ql-align-justify]:text-justify',

                /*
                 * Quill size
                 */
                '[&_.ql-size-small]:text-xs',
                '[&_.ql-size-large]:text-xl',
                '[&_.ql-size-huge]:text-2xl',
              ].join(' ')}
              dangerouslySetInnerHTML={{
                __html: rules,
              }}
            />
          ) : (
            <div className='relative z-10 flex min-h-[220px] flex-col items-center justify-center text-center'>
              <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <HiOutlineDocumentText size={26} />
              </span>

              <h3 className='mt-4 text-sm font-black text-text-light dark:text-text-dark'>
                قوانین هنوز ثبت نشده‌اند
              </h3>

              <p className='mt-1.5 text-xs text-subtext-light dark:text-subtext-dark'>
                اطلاعات این بخش به‌زودی تکمیل می‌شود.
              </p>
            </div>
          )}
        </SiteCard>

        {/* Bottom note */}
        <div className='mt-4 flex items-start gap-2 px-2 text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
          <HiOutlineInformationCircle
            size={16}
            className='mt-1 shrink-0 text-secondary'
          />

          <p>
            استفاده از خدمات سمانه یوگا به معنی مطالعه و پذیرش شرایط و مقررات
            درج‌شده در این صفحه است.
          </p>
        </div>
      </div>
    </div>
  );
};

RulesContent.propTypes = {
  rules: PropTypes.string.isRequired,
};

export default RulesContent;
