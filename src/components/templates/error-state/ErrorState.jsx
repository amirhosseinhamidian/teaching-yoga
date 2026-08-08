'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { HiOutlineArrowRight, HiOutlineHome } from 'react-icons/hi2';

const icons = {
  notFound: (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.7'
      className='h-9 w-9'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='9' />

      <path d='m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z' />

      <circle cx='12' cy='12' r='1' fill='currentColor' stroke='none' />
    </svg>
  ),

  forbidden: (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.7'
      className='h-9 w-9'
      aria-hidden='true'
    >
      <rect x='5' y='10' width='14' height='10' rx='2.5' />

      <path d='M8 10V7a4 4 0 0 1 8 0v3' />

      <path d='M12 14v2.5' />
    </svg>
  ),

  server: (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.7'
      className='h-9 w-9'
      aria-hidden='true'
    >
      <path d='M12 3 2.8 19a1.3 1.3 0 0 0 1.1 2h16.2a1.3 1.3 0 0 0 1.1-2L12 3Z' />

      <path d='M12 9v5' />

      <circle cx='12' cy='17.5' r='.8' fill='currentColor' stroke='none' />
    </svg>
  ),
};

const ErrorState = ({
  code,
  eyebrow,
  title,
  description,
  variant = 'server',

  primaryHref = '/',
  primaryLabel = 'بازگشت به خانه',

  secondaryHref = null,
  secondaryLabel = null,

  retryLabel = 'تلاش مجدد',
  onRetry = null,

  showBackButton = true,
  fullScreen = false,
}) => {
  const router = useRouter();

  return (
    <main
      dir='rtl'
      className={`relative isolate overflow-hidden bg-background-light px-4 dark:bg-background-dark ${
        fullScreen
          ? 'flex min-h-screen items-center py-8 sm:py-12'
          : 'min-h-[68vh] py-14 sm:px-6 sm:py-20'
      }`}
    >
      {/* Background */}
      <div
        aria-hidden='true'
        className='absolute -right-32 -top-32 h-80 w-80 rounded-full bg-secondary/10 blur-[110px] sm:h-[420px] sm:w-[420px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/10 absolute -bottom-36 -left-32 h-80 w-80 rounded-full blur-[120px] sm:h-[440px] sm:w-[440px]'
      />

      <div
        aria-hidden='true'
        className='absolute left-1/2 top-0 h-px w-4/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/25 to-transparent'
      />

      <div className='relative mx-auto flex w-full max-w-5xl items-center justify-center'>
        <SiteCard
          as='section'
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='w-full p-5 sm:p-8 lg:p-12'
        >
          <div
            aria-hidden='true'
            className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
          />

          <div className='relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12'>
            {/* Content */}
            <div className='order-2 text-center lg:order-1 lg:text-right'>
              <div className='inline-flex min-h-8 items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 text-[10px] font-bold text-secondary sm:text-xs'>
                <span className='h-2 w-2 rounded-full bg-secondary' />

                {eyebrow}
              </div>

              <h1 className='mt-4 text-xl font-black leading-9 text-text-light sm:text-2xl sm:leading-10 lg:text-3xl lg:leading-[1.7] dark:text-text-dark'>
                {title}
              </h1>

              <p className='mx-auto mt-3 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 lg:mx-0 lg:text-base lg:leading-9 dark:text-subtext-dark'>
                {description}
              </p>

              {/* Actions */}
              <div className='mt-6 flex flex-col justify-center gap-2.5 sm:flex-row sm:flex-wrap lg:justify-start'>
                {onRetry ? (
                  <SiteButton
                    type='button'
                    variant='primary'
                    size='md'
                    onClick={onRetry}
                    className='w-full sm:w-auto'
                  >
                    {retryLabel}
                  </SiteButton>
                ) : (
                  <SiteButton
                    href={primaryHref}
                    variant='primary'
                    size='md'
                    startIcon={HiOutlineHome}
                    className='w-full sm:w-auto'
                  >
                    {primaryLabel}
                  </SiteButton>
                )}

                {onRetry && (
                  <SiteButton
                    href={primaryHref}
                    variant='secondary'
                    size='md'
                    startIcon={HiOutlineHome}
                    className='w-full sm:w-auto'
                  >
                    {primaryLabel}
                  </SiteButton>
                )}

                {secondaryHref && secondaryLabel && (
                  <SiteButton
                    href={secondaryHref}
                    variant='outline'
                    size='md'
                    className='w-full sm:w-auto'
                  >
                    {secondaryLabel}
                  </SiteButton>
                )}
              </div>

              {showBackButton && (
                <button
                  type='button'
                  onClick={() => router.back()}
                  className='mx-auto mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-subtext-light transition-colors duration-200 hover:text-secondary lg:mx-0 dark:text-subtext-dark'
                >
                  <HiOutlineArrowRight size={16} />

                  <span>بازگشت به صفحه قبل</span>
                </button>
              )}
            </div>

            {/* Illustration */}
            <div className='order-1 flex items-center justify-center lg:order-2'>
              <div className='relative flex h-[180px] w-[180px] items-center justify-center sm:h-[220px] sm:w-[220px] lg:h-[260px] lg:w-[260px]'>
                <div
                  aria-hidden='true'
                  className='absolute inset-0 rounded-full border border-dashed border-secondary/20'
                />

                <div
                  aria-hidden='true'
                  className='absolute h-[78%] w-[78%] rotate-12 rounded-[32px] border border-secondary/10 bg-secondary/[0.035] dark:bg-secondary/[0.07]'
                />

                <div
                  aria-hidden='true'
                  className='absolute h-[70%] w-[70%] rounded-full bg-secondary/10 blur-[35px]'
                />

                <div className='relative flex flex-col items-center text-center'>
                  <span className='flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/15 bg-surface-light/80 text-secondary shadow-[0_14px_40px_rgba(38,145,125,0.15)] backdrop-blur-md sm:h-16 sm:w-16 dark:bg-surface-dark/80'>
                    {icons[variant] || icons.server}
                  </span>

                  <span className='mt-3 font-faNa text-5xl font-black leading-none tracking-tight text-secondary sm:text-6xl lg:text-7xl'>
                    {code}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SiteCard>
      </div>
    </main>
  );
};

ErrorState.propTypes = {
  code: PropTypes.string.isRequired,
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,

  variant: PropTypes.oneOf(['notFound', 'forbidden', 'server']),

  primaryHref: PropTypes.string,
  primaryLabel: PropTypes.string,

  secondaryHref: PropTypes.string,
  secondaryLabel: PropTypes.string,

  retryLabel: PropTypes.string,
  onRetry: PropTypes.func,

  showBackButton: PropTypes.bool,
  fullScreen: PropTypes.bool,
};

export default ErrorState;
