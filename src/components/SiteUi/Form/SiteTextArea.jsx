'use client';

import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const SiteTextArea = ({
  value,
  onChange,
  placeholder = '',
  label,
  hint,
  error,
  rows = 5,
  disabled = false,
  className = '',
  textareaClassName = '',
  id,
}) => {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className='mb-2 block text-xs font-bold text-text-light dark:text-text-dark'
        >
          {label}
        </label>
      )}

      <textarea
        id={id}
        value={value}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full resize-y rounded-[18px] border bg-background-light/60 px-4 py-3 text-xs leading-7 text-text-light outline-none transition-all duration-300',
          'placeholder:text-subtext-light/50',
          'focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'dark:bg-background-dark/45 dark:text-text-dark dark:placeholder:text-subtext-dark/50',
          error ? 'border-rose-400' : 'border-black/5 dark:border-white/10',
          textareaClassName
        )}
      />

      {(hint || error) && (
        <p
          className={cn(
            'mt-1.5 text-[9px] leading-5',
            error
              ? 'text-rose-500'
              : 'text-subtext-light dark:text-subtext-dark'
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
};

SiteTextArea.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,

  placeholder: PropTypes.string,
  label: PropTypes.string,
  hint: PropTypes.string,
  error: PropTypes.string,

  rows: PropTypes.number,
  disabled: PropTypes.bool,

  id: PropTypes.string,

  className: PropTypes.string,
  textareaClassName: PropTypes.string,
};

export default SiteTextArea;
