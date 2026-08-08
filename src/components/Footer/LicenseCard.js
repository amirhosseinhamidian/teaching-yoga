import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import { HiOutlineArrowLeft, HiOutlineCheckBadge } from 'react-icons/hi2';

const LicenseCard = ({ licenseLogo, title, path = null }) => {
  const content = (
    <div className='group flex min-w-[210px] items-center gap-4 rounded-[22px] border border-black/5 bg-surface-light/65 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-[0_15px_40px_rgba(38,145,125,0.10)] dark:border-white/10 dark:bg-surface-dark/55'>
      <div className='relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm'>
        <Image
          src={licenseLogo}
          alt={title || 'مجوز سامانه'}
          width={70}
          height={70}
          className='h-full w-full object-contain'
        />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2 text-secondary'>
          <HiOutlineCheckBadge size={18} className='shrink-0' />

          <span className='text-[11px] font-bold'>مجوز معتبر</span>
        </div>

        <h4 className='mt-1 text-sm font-black text-text-light dark:text-text-dark'>
          {title}
        </h4>

        {path && (
          <span className='mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-subtext-light transition-colors duration-300 group-hover:text-secondary dark:text-subtext-dark'>
            <span>مشاهده اعتبار</span>

            <HiOutlineArrowLeft
              size={14}
              className='transition-transform duration-300 group-hover:-translate-x-1'
            />
          </span>
        )}
      </div>
    </div>
  );

  if (!path) {
    return content;
  }

  return (
    <a
      href={path}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={`مشاهده مجوز ${title}`}
    >
      {content}
    </a>
  );
};

LicenseCard.propTypes = {
  licenseLogo: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  path: PropTypes.string,
};

export default LicenseCard;
