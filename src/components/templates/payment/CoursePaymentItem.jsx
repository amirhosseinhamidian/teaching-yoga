import React from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

const CoursePaymentItem = ({ data }) => {
  return (
    <>
      <div className='flex items-center justify-between gap-2 pb-6'>
        <div className='flex flex-wrap items-center gap-2 sm:flex-nowrap'>
          <Image
            src={data.courseCoverImage}
            alt={data.courseTitle}
            width={280}
            height={160}
            className='h-9 w-14 rounded-lg object-cover sm:h-14 sm:w-20'
          />
          <h3 className='text-sm md:text-base'>{data.courseTitle}</h3>
        </div>

        <div className='flex items-baseline gap-1'>
          {data.finalPrice === 0 ? (
            <h3 className='font-faNa text-sm font-semibold sm:text-base'>
              رایگان
            </h3>
          ) : (
            <>
              <h3 className='font-faNa text-sm font-semibold sm:text-base'>
                {data.finalPrice.toLocaleString('fa-IR')}
              </h3>
              <h6 className='text-2xs'>تومان</h6>
            </>
          )}
        </div>
      </div>
    </>
  );
};

CoursePaymentItem.propTypes = {
  data: PropTypes.object.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
};

export default CoursePaymentItem;
