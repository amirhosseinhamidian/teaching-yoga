import React from 'react';
import PropTypes from 'prop-types';

import cn from '@/utils/cn';

const SectionHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
  align = 'start',
  className = '',
}) => {
  const centered = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',

        centered && 'items-center text-center sm:flex-col sm:items-center',

        className
      )}
    >
      <div
        className={cn(
          'flex items-start gap-3',

          centered && 'flex-col items-center'
        )}
      >
        {Icon && (
          <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <Icon size={23} aria-hidden='true' />
          </span>
        )}

        <div>
          {eyebrow && (
            <p className='mb-1 text-[10px] font-bold text-secondary sm:text-xs'>
              {eyebrow}
            </p>
          )}

          <h2 className='text-xl font-black leading-9 text-text-light sm:text-2xl dark:text-text-dark'>
            {title}
          </h2>

          {description && (
            <p className='mt-2 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
              {description}
            </p>
          )}
        </div>
      </div>

      {action && <div className='shrink-0'>{action}</div>}
    </div>
  );
};

SectionHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.string,

  icon: PropTypes.elementType,

  action: PropTypes.node,

  align: PropTypes.oneOf(['start', 'center']),

  className: PropTypes.string,
};

export default SectionHeader;
