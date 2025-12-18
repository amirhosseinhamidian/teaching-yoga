import React from 'react';
import PropTypes from 'prop-types';
// import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import Image from 'next/image';

const InstructorCard = ({ instructor, className }) => {
  const user = instructor.user;
  return (
    <div
      className={`flex flex-col justify-between gap-4 rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
    >
      <div>
        <h4 className='mb-4 mr-3 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
          مدرس دوره
        </h4>
        <div className='mb-2 mt-1 flex flex-wrap items-center gap-2 md:mt-3'>
          <Image
            src={user?.avatar || '/images/default-profile.png'}
            alt='instructor avatar'
            width={240}
            height={240}
            className='h-11 w-11 rounded-full border xs:h-12 xs:w-12 sm:h-14 sm:w-14'
          />
          <h5 className='min-w-16 text-xs sm:text-sm'>
            {user.firstname} {user.lastname} | {instructor.describe}
          </h5>
        </div>
      </div>
      {/* <OutlineButton
        color='subtext'
        className='mx-auto mb-3 w-fit text-xs font-normal sm:text-sm'
      >
        مشاهده اطلاعات
      </OutlineButton> */}
    </div>
  );
};

InstructorCard.propTypes = {
  instructor: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default InstructorCard;
