import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const variants = {
  default:
    'border-black/5 bg-surface-light/75 shadow-[0_20px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-surface-dark/70 dark:shadow-[0_24px_70px_rgba(0,0,0,0.24)]',

  soft: 'border-black/5 bg-background-light/55 dark:border-white/10 dark:bg-background-dark/40',

  glass:
    'border-black/5 bg-surface-light/70 shadow-[0_24px_75px_rgba(15,23,42,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/65 dark:shadow-[0_28px_85px_rgba(0,0,0,0.25)]',

  secondary:
    'border-secondary/20 bg-secondary/5 shadow-[0_18px_55px_rgba(38,145,125,0.07)] dark:bg-secondary/10',

  yellow:
    'border-yellow/20 bg-yellow/5 shadow-[0_18px_55px_rgba(219,174,49,0.06)] dark:bg-yellow/10',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-5 sm:p-7 lg:p-8',
};

const radiuses = {
  sm: 'rounded-[20px]',
  md: 'rounded-[24px]',
  lg: 'rounded-[28px]',
};

const SiteCard = ({
  children,
  as = 'div',
  variant = 'default',
  padding = 'md',
  radius = 'md',
  hover = false,
  topLine = false,
  className = '',
  ...props
}) => {
  const Component = as;

  return (
    <Component
      className={cn(
        'relative overflow-hidden border',
        variants[variant],
        paddings[padding],
        radiuses[radius],

        hover &&
          'transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25',

        className
      )}
      {...props}
    >
      {topLine && (
        <div
          aria-hidden='true'
          className='absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-secondary/55 to-transparent'
        />
      )}

      {children}
    </Component>
  );
};

SiteCard.propTypes = {
  children: PropTypes.node.isRequired,

  as: PropTypes.oneOf(['div', 'section', 'article', 'aside']),

  variant: PropTypes.oneOf(['default', 'soft', 'glass', 'secondary', 'yellow']),

  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),

  radius: PropTypes.oneOf(['sm', 'md', 'lg']),

  hover: PropTypes.bool,
  topLine: PropTypes.bool,

  className: PropTypes.string,
};

export default SiteCard;
