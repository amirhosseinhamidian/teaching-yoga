'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';

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
}) => {
  const router = useRouter();

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-[68vh] overflow-hidden bg-background-light px-4 py-14 sm:px-6 sm:py-20 dark:bg-background-dark'
    >
      {/* دکور پس‌زمینه با رنگ اصلی سایت */}
      <div
        aria-hidden='true'
        className='absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl'
      />

      <div
        aria-hidden='true'
        className='absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl'
      />

      <div className='relative mx-auto flex w-full max-w-5xl items-center justify-center'>
        <section className='relative w-full overflow-hidden rounded-[2rem] border border-subtext-light/20 bg-surface-light/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-10 lg:p-14 dark:border-subtext-dark/20 dark:bg-surface-dark/95'>
          {/* خط رنگی بالای کارت */}
          <div className='absolute inset-x-0 top-0 h-1 bg-primary' />

          <div className='grid items-center gap-10 lg:grid-cols-[1fr_0.8fr]'>
            <div>
              <div className='mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-medium text-secondary'>
                <span className='h-2 w-2 rounded-full bg-secondary' />

                {eyebrow}
              </div>

              <h1 className='font-faNa text-2xl font-bold leading-relaxed text-text-light sm:text-3xl lg:text-4xl dark:text-text-dark'>
                {title}
              </h1>

              <p className='mt-4 max-w-2xl text-sm leading-8 text-subtext-light sm:text-base dark:text-subtext-dark'>
                {description}
              </p>

              <div className='mt-8 flex flex-wrap items-center gap-3'>
                {onRetry ? (
                  <button
                    type='button'
                    onClick={onRetry}
                    className='inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/20'
                  >
                    {retryLabel}
                  </button>
                ) : (
                  <Link
                    href={primaryHref}
                    className='inline-flex min-h-11 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-primary/20'
                  >
                    {primaryLabel}
                  </Link>
                )}

                {onRetry && (
                  <Link
                    href={primaryHref}
                    className='inline-flex min-h-11 items-center justify-center rounded-xl border border-subtext-light/30 bg-surface-light px-6 text-sm font-medium text-text-light transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-subtext-dark/30 dark:bg-surface-dark dark:text-text-dark'
                  >
                    {primaryLabel}
                  </Link>
                )}

                {secondaryHref && secondaryLabel && (
                  <Link
                    href={secondaryHref}
                    className='inline-flex min-h-11 items-center justify-center rounded-xl border border-subtext-light/30 bg-surface-light px-6 text-sm font-medium text-text-light transition duration-200 hover:-translate-y-0.5 hover:border-secondary hover:text-secondary dark:border-subtext-dark/30 dark:bg-surface-dark dark:text-text-dark'
                  >
                    {secondaryLabel}
                  </Link>
                )}
              </div>

              {showBackButton && (
                <button
                  type='button'
                  onClick={() => router.back()}
                  className='mt-6 inline-flex items-center gap-2 text-sm text-subtext-light transition hover:text-primary dark:text-subtext-dark'
                >
                  <svg
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.8'
                    className='h-4 w-4'
                    aria-hidden='true'
                  >
                    <path d='m15 18-6-6 6-6' />
                  </svg>
                  بازگشت به صفحه قبل
                </button>
              )}
            </div>

            <div className='relative flex min-h-64 items-center justify-center'>
              <div
                aria-hidden='true'
                className='absolute h-56 w-56 rounded-full border border-primary/10 bg-primary/5 sm:h-64 sm:w-64'
              />

              <div
                aria-hidden='true'
                className='absolute h-44 w-44 rotate-12 rounded-[2rem] border border-subtext-light/10 bg-surface-light/70 shadow-xl backdrop-blur dark:border-subtext-dark/10 dark:bg-surface-dark/70'
              />

              <div className='relative flex flex-col items-center text-center'>
                <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg'>
                  {icons[variant] || icons.server}
                </div>

                <span className='font-faNa text-7xl font-black tracking-tight text-primary sm:text-8xl'>
                  {code}
                </span>
              </div>
            </div>
          </div>
        </section>
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
};

export default ErrorState;
