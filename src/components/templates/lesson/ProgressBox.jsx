import React from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '@/components/Ui/ProgressBar/ProgressBar ';

const ProgressBox = ({ progress }) => {
  return (
    <div className='rounded-xl bg-surface-light p-2 dark:bg-surface-dark'>
      <h4 className='mr-3 mt-2 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
        میزان پیشرفت
      </h4>
      <ProgressBar progress={progress} className='mt-4' />
      <p className='mb-2 mr-3 mt-2 font-faNa text-2xs text-subtext-light sm:text-sm dark:text-subtext-dark'>
        با گذر از ۸۰٪ جلسه، پیشرفت شما ثبت می‌شود.
      </p>
    </div>
  );
};

ProgressBox.propTypes = {
  progress: PropTypes.number.isRequired,
};

export default ProgressBox;
