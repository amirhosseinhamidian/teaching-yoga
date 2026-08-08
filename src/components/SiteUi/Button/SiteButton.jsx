import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import cn from '@/utils/cn';

import LoadingSpinner from '../Loading/LoadingSpinner';

const variantClasses = {
  primary:
    'border border-secondary bg-secondary text-white shadow-[0_12px_28px_rgba(38,145,125,0.22)] hover:-translate-y-0.5 hover:shadow-[0_17px_36px_rgba(38,145,125,0.30)]',

  secondary:
    'border border-secondary/20 bg-secondary/10 text-secondary hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white',

  outline:
    'border border-black/10 bg-transparent text-text-light hover:-translate-y-0.5 hover:border-secondary/40 hover:text-secondary dark:border-white/10 dark:text-text-dark',

  ghost:
    'border border-transparent bg-transparent text-text-light hover:bg-secondary/10 hover:text-secondary dark:text-text-dark',

  yellow:
    'border border-primary bg-primary text-white shadow-[0_12px_28px_rgba(219,174,49,0.20)] hover:-translate-y-0.5 hover:shadow-[0_17px_36px_rgba(219,174,49,0.28)]',

  danger:
    'border border-rose-500 bg-rose-500 text-white hover:-translate-y-0.5 hover:bg-rose-600',
};

const sizeClasses = {
  sm: 'h-10 rounded-xl px-3.5 text-[11px] gap-1.5',
  md: 'h-11 rounded-xl px-4 text-xs gap-2',
  lg: 'h-12 rounded-2xl px-5 text-sm gap-2',
};

const iconSizeMap = {
  sm: 16,
  md: 18,
  lg: 20,
};

const SiteButton = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  startIcon: StartIcon,
  endIcon: EndIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading ? (
        <LoadingSpinner
          size={size === 'lg' ? 'md' : 'sm'}
          light={
            variant === 'primary' ||
            variant === 'yellow' ||
            variant === 'danger'
          }
        />
      ) : (
        StartIcon && (
          <StartIcon
            size={iconSizeMap[size]}
            className='shrink-0'
            aria-hidden='true'
          />
        )
      )}

      <span className='min-w-0 truncate'>{children}</span>

      {!loading && EndIcon && (
        <EndIcon
          size={iconSizeMap[size]}
          className='shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5'
          aria-hidden='true'
        />
      )}
    </>
  );

  const classes = cn(
    'group inline-flex items-center justify-center whitespace-nowrap font-bold leading-none outline-none transition-all duration-300',
    'focus-visible:ring-4 focus-visible:ring-secondary/15',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    isDisabled &&
      'cursor-not-allowed opacity-55 hover:translate-y-0 hover:shadow-none',
    className
  );

  if (href && !isDisabled) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href && isDisabled) {
    return (
      <span aria-disabled='true' className={classes}>
        {content}
      </span>
    );
  }

  return (
    <button type={type} disabled={isDisabled} className={classes} {...props}>
      {content}
    </button>
  );
};

SiteButton.propTypes = {
  children: PropTypes.node.isRequired,
  href: PropTypes.string,

  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'yellow',
    'danger',
  ]),

  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  startIcon: PropTypes.elementType,
  endIcon: PropTypes.elementType,

  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,

  className: PropTypes.string,

  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default SiteButton;
