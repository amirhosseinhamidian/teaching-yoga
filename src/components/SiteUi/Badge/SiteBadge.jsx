import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const variants = {
  secondary: 'border-secondary/20 bg-secondary/10 text-secondary',

  yellow: 'border-primary/25 bg-primary/10 text-primary',

  neutral:
    'border-black/5 bg-background-light/60 text-text-light dark:border-white/10 dark:bg-background-dark/45 dark:text-text-dark',

  success:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',

  danger: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

const sizes = {
  sm: 'min-h-7 gap-1 px-2.5 text-[9px]',
  md: 'min-h-8 gap-1.5 px-3 text-[10px]',
  lg: 'min-h-9 gap-2 px-3.5 text-xs',
};

const iconSizes = {
  sm: 13,
  md: 15,
  lg: 17,
};

const SiteBadge = ({
  children,
  icon: Icon,
  variant = 'secondary',
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center justify-center rounded-full border font-bold leading-none',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {Icon && (
        <Icon size={iconSizes[size]} className='shrink-0' aria-hidden='true' />
      )}

      <span>{children}</span>
    </span>
  );
};

SiteBadge.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.elementType,

  variant: PropTypes.oneOf([
    'secondary',
    'yellow',
    'neutral',
    'success',
    'danger',
  ]),

  size: PropTypes.oneOf(['sm', 'md', 'lg']),

  className: PropTypes.string,
};

export default SiteBadge;
