import React from 'react';
import PropTypes from 'prop-types';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteProgressBar from '@/components/SiteUi/Progress/SiteProgressBar';

import {
  HiOutlineChartBar,
  HiOutlineCheckBadge,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const ProgressBox = ({ progress, className = '' }) => {
  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='md'
      radius='md'
      topLine
      className={className}
    >
      <div
        aria-hidden='true'
        className='absolute -right-16 -top-16 h-40 w-40 rounded-full bg-secondary/10 blur-[60px]'
      />

      <div className='relative z-10'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
              <HiOutlineChartBar size={21} />
            </span>

            <div>
              <div className='flex items-center gap-1.5 text-secondary'>
                <HiOutlineSparkles size={13} />

                <span className='text-[9px] font-bold'>مسیر یادگیری</span>
              </div>

              <h3 className='mt-0.5 text-sm font-black text-text-light dark:text-text-dark'>
                میزان پیشرفت
              </h3>
            </div>
          </div>

          <SiteBadge
            icon={HiOutlineCheckBadge}
            variant='secondary'
            size='sm'
            className='font-faNa'
          >
            {Number(progress || 0).toLocaleString('fa-IR')}٪
          </SiteBadge>
        </div>

        <SiteProgressBar
          progress={progress}
          showValue={false}
          className='mt-5'
        />

        <p className='mt-3 text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
          با گذر از
          <span className='mx-1 font-faNa font-black text-secondary'>۸۰٪</span>
          هر جلسه، پیشرفت شما ثبت می‌شود.
        </p>
      </div>
    </SiteCard>
  );
};

ProgressBox.propTypes = {
  progress: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default ProgressBox;
