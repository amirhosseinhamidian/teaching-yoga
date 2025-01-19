'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { LuTrash } from 'react-icons/lu';
import Modal from '@/components/modules/Modal/Modal';

const CourseItem = ({ data, onDeleteItem }) => {
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);

  const handleDeleteCourse = async (courseId) => {
    await onDeleteItem(courseId);
    setShowDeleteItemModal(false);
  };

  const getCoursePrice = (coursePrice) => {
    return coursePrice === 0 ? (
      <h3 className='mt-1 font-faNa text-xs sm:text-sm'>رایگان</h3>
    ) : (
      <h3 className='mt-1 font-faNa text-xs sm:text-sm'>
        قیمت نهایی: {coursePrice.toLocaleString('fa-IR')}{' '}
        <span className='text-[8px] sm:text-2xs'>تومان</span>
      </h3>
    );
  };

  return (
    <>
      <div className='flex items-start justify-between gap-2 p-4'>
        <div className='flex flex-wrap gap-2 md:gap-4'>
          <Image
            src={data.courseCoverImage}
            alt={data.courseTitle}
            width={360}
            height={280}
            className='h-9 w-14 rounded-lg object-cover xs:h-14 xs:w-20 sm:h-20 sm:w-28'
          />
          <div>
            <h3 className='text-base md:text-lg'>{data.courseTitle}</h3>
            {data.discount !== 0 && (
              <h4 className='mt-1 font-faNa text-xs text-red sm:text-sm'>
                تخفیف: {data.discount.toLocaleString('fa-IR')}{' '}
                <span className='text-[8px] sm:text-2xs'>تومان</span>
              </h4>
            )}
            {getCoursePrice(data.finalPrice)}
          </div>
        </div>
        <LuTrash
          size={20}
          className='ml-4 mt-2 text-red md:cursor-pointer'
          onClick={() => setShowDeleteItemModal(true)}
        />
      </div>
      {showDeleteItemModal && (
        <Modal
          title='حذف دوره از سبد خرید'
          desc={`آیا از حذف ${data.courseTitle} از سبد خرید خود مطمئن هستید؟`}
          icon={LuTrash}
          iconSize={32}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => setShowDeleteItemModal(false)}
          secondaryButtonClick={() => handleDeleteCourse(data.courseId)}
        />
      )}
    </>
  );
};

CourseItem.propTypes = {
  data: PropTypes.object.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
};

export default CourseItem;
