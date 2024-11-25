import React from 'react';
import PropTypes from 'prop-types';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

const InstructorCard = ({ instructor, className }) => {
  const user = instructor.user;
  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark ${className}`}
    >
      <div>
        <h4 className='mb-4 mr-3 text-xs font-semibold text-subtext-light sm:text-sm dark:text-subtext-dark'>
          مدرس دوره
        </h4>
        <div className='mb-2 mt-1 flex items-center gap-2 md:mt-3'>
          <img
            src={user.avatar}
            alt='instructor avatar'
            className='h-14 w-14 rounded-full'
          />
          <h5 className='text-sm sm:text-base'>
            {user.firstname} {user.lastname} | {instructor.describe}
          </h5>
        </div>
      </div>
      <OutlineButton
        color='subtext'
        className='mx-auto mb-3 w-fit text-xs font-normal sm:text-sm'
      >
        مشاهده اطلاعات
      </OutlineButton>
    </div>
  );
};

InstructorCard.propTypes = {
  instructor: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default InstructorCard;
