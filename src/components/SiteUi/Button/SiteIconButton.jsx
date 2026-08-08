import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

import cn from '@/utils/cn';

import LoadingSpinner from '../Loading/LoadingSpinner';

const variantClasses = {
  primary:
    'border-secondary bg-secondary text-white shadow-[0_10px_25px_rgba(38,145,125,0.20)] hover:-translate-y-0.5',

  secondary:
    'border-secondary/20 bg-secondary/5 text-secondary hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white dark:bg-secondary/10',

  outline:
    'border-black/10 bg-transparent text-text-light hover:-translate-y-0.5 hover:border-secondary/40 hover:text-secondary dark:border-white/10 dark:text-text-dark',

  ghost:
    'border-transparent bg-transparent text-text-light hover:bg-secondary/10 hover:text-secondary dark:text-text-dark',

  yellow:
    'border-yellow/25 bg-yellow/10 text-yellow hover:-translate-y-0.5 hover:border-yellow hover:bg-yellow hover:text-white',

  danger:
    'border-rose-500/25 bg-rose-500/10 text-rose-500 hover:border-rose-500 hover:bg-rose-500 hover:text-white',
};

const sizeClasses = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};

const iconSizeMap = {
  sm: 18,
  md: 20,
  lg: 22,
};

const SiteIconButton = ({
  icon: Icon,
  href,
  ariaLabel,
  title,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  const classes = cn(
    'inline-flex shrink-0 items-center justify-center border p-0 leading-none outline-none transition-all duration-300',
    'focus-visible:ring-4 focus-visible:ring-secondary/15',
    variantClasses[variant],
    sizeClasses[size],
    isDisabled && 'cursor-not-allowed opacity-55 hover:translate-y-0',
    className
  );

  const content = loading ? (
    <LoadingSpinner
      size='sm'
      light={variant === 'primary' || variant === 'danger'}
    />
  ) : (
    <Icon size={iconSizeMap[size]} aria-hidden='true' />
  );

  if (href && !isDisabled) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        title={title || ariaLabel}
        className={classes}
        {...props}
      >
        {content}
      </Link>
    );
  }

  if (href && isDisabled) {
    return (
      <span
        aria-disabled='true'
        aria-label={ariaLabel}
        title={title || ariaLabel}
        className={classes}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
};

SiteIconButton.propTypes = {
  icon: PropTypes.elementType.isRequired,

  href: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  title: PropTypes.string,

  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'yellow',
    'danger',
  ]),

  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,

  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default SiteIconButton;
