import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

import SiteBadge from '../Badge/SiteBadge';
import SiteCard from '../Card/SiteCard';

const variantClasses = {
  full: 'px-4 py-5 sm:px-7 sm:py-8 lg:px-10 lg:py-10',

  compact: 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-7',

  minimal: 'px-4 py-3 sm:px-6 sm:py-5 lg:px-7 lg:py-6',
};

const titleClasses = {
  full: 'text-2xl leading-10 sm:text-3xl sm:leading-[1.7] lg:text-4xl xl:text-5xl',

  compact:
    'text-xl leading-9 sm:text-2xl sm:leading-10 lg:text-3xl lg:leading-[1.65]',

  minimal: 'text-xl leading-9 sm:text-2xl sm:leading-10 lg:text-[28px]',
};

const PageIntro = ({
  eyebrow,
  eyebrowIcon,

  title,
  highlight,
  description,

  visualIcon: VisualIcon,

  floatingLabels = [],

  stats = [],

  variant = 'compact',

  className = '',
}) => {
  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={cn(variantClasses[variant], className)}
    >
      {/* Background glow */}
      <div
        aria-hidden='true'
        className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px] sm:h-72 sm:w-72'
      />

      <div
        aria-hidden='true'
        className='absolute -bottom-28 left-[20%] hidden h-64 w-64 rounded-full bg-primary/10 blur-[95px] sm:block'
      />

      <div
        className={cn(
          'relative z-10',

          VisualIcon
            ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center lg:gap-8'
            : ''
        )}
      >
        {/* Content */}
        <div className='min-w-0'>
          {eyebrow && (
            <SiteBadge icon={eyebrowIcon} size='sm' className='mb-3 sm:mb-4'>
              {eyebrow}
            </SiteBadge>
          )}

          <h1
            className={cn(
              'font-black text-text-light dark:text-text-dark',
              titleClasses[variant]
            )}
          >
            {title}

            {highlight && (
              <>
                {' '}
                <span className='relative text-secondary'>
                  {highlight}
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 260 22'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-3 w-full'
                  >
                    <path
                      d='M5 14C54 4 102 18 151 10C191 4 223 6 255 11'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='5'
                      strokeLinecap='round'
                      opacity='0.8'
                    />

                    <path
                      d='M25 19C74 14 126 19 183 14'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      opacity='0.35'
                    />
                  </svg>
                </span>
              </>
            )}
          </h1>

          {description && (
            <p className='mt-2 line-clamp-2 max-w-2xl text-xs leading-7 text-subtext-light sm:mt-4 sm:line-clamp-none sm:text-sm sm:leading-8 lg:text-base lg:leading-9 dark:text-subtext-dark'>
              {description}
            </p>
          )}

          {stats.length > 0 && (
            <div className='mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3'>
              {stats.slice(0, 3).map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={`${stat.label}-${index}`}
                    className={cn(
                      'items-center gap-1.5 rounded-xl border border-black/5 bg-background-light/55 px-3 py-2 text-[10px] font-bold text-text-light dark:border-white/10 dark:bg-background-dark/40 dark:text-text-dark',

                      index === 0 ? 'flex' : 'hidden sm:flex'
                    )}
                  >
                    {Icon && (
                      <Icon
                        size={16}
                        className='shrink-0 text-secondary'
                        aria-hidden='true'
                      />
                    )}

                    <span>
                      {stat.value && (
                        <span className='ml-1 font-faNa font-black'>
                          {stat.value}
                        </span>
                      )}

                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Visual */}
        {VisualIcon && (
          <div className='relative hidden h-[260px] items-center justify-center lg:flex'>
            {/* Large glow */}
            <div
              aria-hidden='true'
              className='absolute h-[245px] w-[245px] rounded-full bg-secondary/[0.07] blur-[28px]'
            />

            <div
              aria-hidden='true'
              className='absolute h-[205px] w-[205px] rounded-full bg-primary/[0.08] blur-[22px]'
            />

            {/* Outer orbit */}
            <div
              aria-hidden='true'
              className='site-orbit absolute h-[245px] w-[245px] rounded-full border border-dashed border-primary'
            />

            {/* Inner orbit */}
            <div
              aria-hidden='true'
              className='site-orbit-reverse absolute h-[190px] w-[190px] rounded-full border border-dashed border-secondary/20'
            />

            {/* Central icon */}
            <div className='site-float relative z-10 flex h-[145px] w-[145px] items-center justify-center rounded-[38px] border border-white/50 bg-surface-light/80 text-secondary shadow-[0_25px_70px_rgba(38,145,125,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/80'>
              <VisualIcon size={74} aria-hidden='true' />
            </div>

            {/* Floating label 1 */}
            {floatingLabels?.[0] && (
              <div
                className={cn(
                  'site-float-delayed absolute z-20 flex min-h-11 items-center rounded-2xl border bg-surface-light/90 px-4 text-xs font-black shadow-[0_14px_34px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:bg-surface-dark/90',

                  floatingLabels[0]?.variant === 'yellow'
                    ? 'border-primary/25 text-secondary'
                    : 'border-black/5 text-text-light dark:border-white/10 dark:text-text-dark',

                  'right-[-10px] top-[38px]'
                )}
              >
                {floatingLabels[0].text}
              </div>
            )}

            {/* Floating label 2 */}
            {floatingLabels?.[1] && (
              <div
                className={cn(
                  'site-float absolute z-20 flex min-h-11 items-center rounded-2xl border bg-surface-light/90 px-4 text-xs font-black shadow-[0_14px_34px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:bg-surface-dark/90',

                  floatingLabels[1]?.variant === 'yellow'
                    ? 'border-primary/25 text-secondary'
                    : 'border-black/5 text-text-light dark:border-white/10 dark:text-text-dark',

                  '-left-2 bottom-[32px]'
                )}
              >
                {floatingLabels[1].text}
              </div>
            )}

            {/* Small orbit dots */}
            <span
              aria-hidden='true'
              className='site-float-delayed absolute bottom-[42px] right-[42px] h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(219,174,49,0.55)]'
            />

            <span
              aria-hidden='true'
              className='site-float absolute left-[58px] top-[52px] h-2 w-2 rounded-full bg-secondary shadow-[0_0_16px_rgba(38,145,125,0.5)]'
            />
          </div>
        )}
      </div>
    </SiteCard>
  );
};

PageIntro.propTypes = {
  eyebrow: PropTypes.string,
  eyebrowIcon: PropTypes.elementType,

  title: PropTypes.node.isRequired,
  highlight: PropTypes.node,

  description: PropTypes.string,

  visualIcon: PropTypes.elementType,

  floatingLabels: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,

      variant: PropTypes.oneOf(['secondary', 'yellow', 'neutral']),
    })
  ),

  stats: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType,
      value: PropTypes.node,
      label: PropTypes.string.isRequired,
    })
  ),

  variant: PropTypes.oneOf(['full', 'compact', 'minimal']),

  className: PropTypes.string,
};

export default PageIntro;
