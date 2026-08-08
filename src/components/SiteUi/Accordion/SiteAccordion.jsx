'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const SiteAccordion = ({
  title,
  subtitle,
  info1,
  info2,
  content,
  isOpenDefault = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(Boolean(isOpenDefault));

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] border transition-colors duration-300',
        isOpen
          ? 'border-secondary/25 bg-secondary/[0.035] dark:bg-secondary/[0.07]'
          : 'border-black/5 bg-background-light/45 dark:border-white/10 dark:bg-background-dark/35',
        className
      )}
    >
      <button
        type='button'
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className='flex w-full items-center justify-between gap-3 px-4 py-3.5 text-right sm:px-5 sm:py-4'
      >
        <div className='min-w-0 flex-1'>
          <h3
            className={cn(
              'text-xs font-black leading-7 transition-colors sm:text-sm',
              isOpen ? 'text-secondary' : 'text-text-light dark:text-text-dark'
            )}
          >
            {title}
          </h3>

          {subtitle && (
            <p className='mt-0.5 line-clamp-1 text-[9px] leading-5 text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
              {subtitle}
            </p>
          )}

          {(info1 || info2) && (
            <div className='mt-2 flex flex-wrap items-center gap-1.5'>
              {info1 && (
                <span className='rounded-lg border border-secondary/10 bg-secondary/5 px-2 py-1 text-[9px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                  {info1}
                </span>
              )}

              {info2 && (
                <span className='rounded-lg border border-secondary/10 bg-secondary/5 px-2 py-1 text-[9px] text-subtext-light dark:bg-secondary/10 dark:text-subtext-dark'>
                  {info2}
                </span>
              )}
            </div>
          )}
        </div>

        <span
          aria-hidden='true'
          className={cn(
            'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-300',
            isOpen
              ? 'rotate-180 border-secondary bg-secondary text-white'
              : 'border-black/10 bg-surface-light text-text-light dark:border-white/10 dark:bg-surface-dark dark:text-text-dark'
          )}
        >
          <span className='h-2 w-2 rotate-[-45deg] border-b-2 border-l-2 border-current' />
        </span>
      </button>

      {isOpen && (
        <div className='border-t border-black/5 px-3 py-3 sm:px-4 sm:py-4 dark:border-white/10'>
          {content}
        </div>
      )}
    </div>
  );
};

SiteAccordion.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  info1: PropTypes.node,
  info2: PropTypes.node,
  content: PropTypes.node,

  isOpenDefault: PropTypes.bool,

  className: PropTypes.string,
};

export default SiteAccordion;
