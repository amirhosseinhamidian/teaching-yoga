'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SectionHeader from '@/components/SiteUi/SectionHeader/SectionHeader';

import { HiOutlineBookOpen } from 'react-icons/hi2';

const CourseDescriptionCard = ({ description, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const normalized = typeof description === 'string' ? description.trim() : '';

  const canExpand = useMemo(() => normalized.length > 420, [normalized]);

  if (!normalized) {
    return null;
  }

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='md'
      radius='md'
      topLine
      className={className}
    >
      <SectionHeader
        eyebrow='آشنایی بیشتر'
        title='درباره این دوره'
        icon={HiOutlineBookOpen}
      />

      <div
        className={`relative mt-4 overflow-hidden transition-[max-height] duration-500 ${
          isExpanded ? 'max-h-[5000px]' : canExpand ? 'max-h-44' : 'max-h-none'
        }`}
      >
        <p className='whitespace-pre-line text-xs leading-8 text-subtext-light sm:text-sm sm:leading-9 dark:text-subtext-dark'>
          {normalized}
        </p>

        {!isExpanded && canExpand && (
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-light via-surface-light/95 to-transparent dark:from-surface-dark dark:via-surface-dark/95' />
        )}
      </div>

      {canExpand && (
        <div className='mt-4 flex justify-center border-t border-black/5 pt-4 dark:border-white/10'>
          <SiteButton
            type='button'
            variant='secondary'
            size='sm'
            onClick={() => setIsExpanded((value) => !value)}
          >
            {isExpanded ? 'بستن توضیحات' : 'مشاهده توضیحات کامل'}
          </SiteButton>
        </div>
      )}
    </SiteCard>
  );
};

CourseDescriptionCard.propTypes = {
  description: PropTypes.string.isRequired,

  className: PropTypes.string,
};

export default CourseDescriptionCard;
