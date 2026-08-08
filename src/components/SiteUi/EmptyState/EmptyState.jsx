import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const EmptyState = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[26px] border border-black/5 bg-background-light/45 px-5 py-9 text-center dark:border-white/10 dark:bg-background-dark/35',
        className
      )}
    >
      <div
        aria-hidden='true'
        className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[70px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/10 absolute -bottom-20 -left-20 h-52 w-52 rounded-full blur-[70px]'
      />

      {Icon && (
        <span className='relative mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] border border-secondary/15 bg-secondary/10 text-secondary'>
          <Icon size={28} aria-hidden='true' />
        </span>
      )}

      {eyebrow && (
        <p className='relative mt-4 text-[10px] font-bold text-secondary sm:text-xs'>
          {eyebrow}
        </p>
      )}

      <h3 className='relative mt-2 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
        {title}
      </h3>

      {description && (
        <p className='relative mx-auto mt-2 max-w-lg text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
          {description}
        </p>
      )}

      {action && (
        <div className='relative mt-5 flex justify-center'>{action}</div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  eyebrow: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  className: PropTypes.string,
};

export default EmptyState;
