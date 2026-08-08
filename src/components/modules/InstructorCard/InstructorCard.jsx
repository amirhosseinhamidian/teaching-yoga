import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { HiOutlineAcademicCap, HiOutlineCheckBadge } from 'react-icons/hi2';

const InstructorCard = ({ instructor, className = '' }) => {
  if (!instructor) {
    return null;
  }

  const user = instructor?.user || {};

  const firstName = user?.firstname || user?.firstName || '';

  const lastName = user?.lastname || user?.lastName || '';

  const fullName = `${firstName} ${lastName}`.trim() || 'مدرس دوره';

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='sm'
      radius='md'
      topLine
      className={className}
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2 text-secondary'>
          <HiOutlineAcademicCap size={18} />

          <span className='text-[10px] font-black sm:text-xs'>مدرس دوره</span>
        </div>

        <SiteBadge icon={HiOutlineCheckBadge} variant='success' size='sm'>
          تأییدشده
        </SiteBadge>
      </div>

      <div className='mt-4 flex items-center gap-3'>
        <Image
          src={user?.avatar || '/images/default-profile.png'}
          alt={`تصویر ${fullName}`}
          width={72}
          height={72}
          className='h-14 w-14 shrink-0 rounded-2xl object-cover shadow-sm'
        />

        <div className='min-w-0'>
          <h3 className='text-sm font-black leading-7 text-text-light dark:text-text-dark'>
            {fullName}
          </h3>

          {instructor?.describe && (
            <p className='mt-1 line-clamp-3 text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
              {instructor.describe}
            </p>
          )}
        </div>
      </div>
    </SiteCard>
  );
};

InstructorCard.propTypes = {
  instructor: PropTypes.shape({
    describe: PropTypes.string,

    user: PropTypes.object,
  }),

  className: PropTypes.string,
};

export default InstructorCard;
