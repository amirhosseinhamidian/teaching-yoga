'use client';

import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

const Modal = ({
  title,
  desc,
  icon: Icon,
  iconSize = 22,
  iconColor,
  primaryButtonClick,
  secondaryButtonClick,
  primaryButtonText = 'تایید',
  className = '',
  secondaryButtonText = 'انصراف',
  children,
  loadingPrimaryButton = false,
}) => {
  const [mounted, setMounted] = useState(false);

  const ModalIcon = Icon || HiOutlineExclamationTriangle;

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      dir='rtl'
      role='dialog'
      aria-modal='true'
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-2 py-4 backdrop-blur-sm sm:px-4 sm:py-6 ${className}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          secondaryButtonClick?.();
        }
      }}
    >
      <SiteCard
        padding='none'
        radius='lg'
        topLine
        className='relative my-auto flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-[560px] flex-col overflow-hidden sm:max-h-[calc(100dvh-3rem)]'
      >
        {/* Decorative glow */}
        <div
          aria-hidden='true'
          className='pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-secondary/10 blur-[85px]'
        />

        <div
          aria-hidden='true'
          className='bg-yellow/10 pointer-events-none absolute -bottom-28 -left-20 h-56 w-56 rounded-full blur-[90px]'
        />

        <div className='relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden'>
          {/* Header */}
          <div className='flex shrink-0 items-start gap-3 border-b border-black/5 px-4 py-4 sm:px-6 sm:py-5 dark:border-white/10'>
            <span
              className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'
              style={
                iconColor
                  ? {
                      color: iconColor,
                    }
                  : undefined
              }
            >
              <ModalIcon size={iconSize} />
            </span>

            <div className='min-w-0 flex-1 pt-0.5'>
              <p className='text-[9px] font-bold text-secondary sm:text-[10px]'>
                نیاز به تأیید شما
              </p>

              <h3 className='mt-0.5 text-sm font-black leading-7 text-text-light sm:text-base dark:text-text-dark'>
                {title}
              </h3>
            </div>
          </div>

          {/* Content */}
          {(desc || children) && (
            <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5'>
              {desc && (
                <div className='rounded-2xl border border-black/5 bg-background-light/45 px-4 py-3.5 text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
                  {desc}
                </div>
              )}

              {children && <div className={desc ? 'mt-4' : ''}>{children}</div>}
            </div>
          )}

          {/* Actions */}
          <div className='flex shrink-0 flex-col-reverse gap-2 border-t border-black/5 bg-background-light/20 px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4 dark:border-white/10 dark:bg-background-dark/15'>
            <SiteButton
              type='button'
              variant='outline'
              size='md'
              onClick={secondaryButtonClick}
              className='w-full sm:w-auto'
            >
              {secondaryButtonText}
            </SiteButton>

            <SiteButton
              type='button'
              variant='primary'
              size='md'
              disabled={loadingPrimaryButton}
              onClick={primaryButtonClick}
              className='w-full sm:w-auto'
            >
              {loadingPrimaryButton ? (
                <span className='flex items-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  در حال انجام...
                </span>
              ) : (
                primaryButtonText
              )}
            </SiteButton>
          </div>
        </div>
      </SiteCard>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  title: PropTypes.string.isRequired,

  desc: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

  children: PropTypes.node,

  icon: PropTypes.elementType,

  primaryButtonClick: PropTypes.func,

  secondaryButtonClick: PropTypes.func,

  iconSize: PropTypes.number,

  iconColor: PropTypes.string,

  primaryButtonText: PropTypes.string,

  secondaryButtonText: PropTypes.string,

  className: PropTypes.string,

  loadingPrimaryButton: PropTypes.bool,
};

export default Modal;
