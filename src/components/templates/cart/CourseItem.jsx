'use client';

import React, { useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';

import Modal from '@/components/modules/Modal/Modal';

import {
  HiOutlineAcademicCap,
  HiOutlinePhoto,
  HiOutlineTrash,
} from 'react-icons/hi2';

const CourseItem = ({ data, onDeleteItem }) => {
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);

  const [imageError, setImageError] = useState(false);

  const handleDeleteCourse = async (courseId) => {
    await onDeleteItem(courseId);

    setShowDeleteItemModal(false);
  };

  const finalPrice = Number(data.finalPrice || 0);

  const discount = Number(data.discount || 0);

  return (
    <>
      <article className='group flex items-start gap-3 p-4 sm:gap-4 sm:p-5'>
        {/* Image */}
        <div className='relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-[18px] border border-black/5 bg-background-light/60 sm:w-32 dark:border-white/10 dark:bg-background-dark/35'>
          {data.courseCoverImage && !imageError ? (
            <Image
              src={data.courseCoverImage}
              alt={data.courseTitle}
              fill
              sizes='128px'
              className='object-cover transition-transform duration-500 group-hover:scale-[1.03]'
              onError={() => setImageError(true)}
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center bg-secondary/5 text-secondary/40'>
              <HiOutlinePhoto size={24} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <div className='mb-1.5 flex items-center gap-1.5 text-[9px] font-bold text-secondary sm:text-[10px]'>
                <HiOutlineAcademicCap size={14} />
                دوره آموزشی
              </div>

              <h3 className='line-clamp-2 text-sm font-black leading-6 text-text-light sm:text-base sm:leading-7 dark:text-text-dark'>
                {data.courseTitle}
              </h3>
            </div>

            <button
              type='button'
              aria-label='حذف دوره'
              onClick={() => setShowDeleteItemModal(true)}
              className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red transition-all duration-200 hover:scale-105 hover:bg-red hover:text-white'
            >
              <HiOutlineTrash size={18} />
            </button>
          </div>

          {/* Price */}
          <div className='mt-3 flex flex-wrap items-end justify-between gap-3'>
            <div>
              {discount !== 0 && (
                <div className='mb-1 flex items-center gap-1'>
                  <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                    تخفیف
                  </span>

                  <strong className='font-faNa text-xs font-black text-red'>
                    {discount.toLocaleString('fa-IR')}
                  </strong>

                  <span className='text-[8px] text-subtext-light dark:text-subtext-dark'>
                    تومان
                  </span>
                </div>
              )}

              {finalPrice === 0 ? (
                <strong className='text-sm font-black'>رایگان</strong>
              ) : (
                <div className='flex items-baseline gap-1'>
                  <strong className='font-faNa text-base font-black sm:text-lg'>
                    {finalPrice.toLocaleString('fa-IR')}
                  </strong>

                  <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                    تومان
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {showDeleteItemModal && (
        <Modal
          title='حذف دوره از سبد خرید'
          desc={`آیا از حذف ${data.courseTitle} از سبد خرید خود مطمئن هستید؟`}
          icon={HiOutlineTrash}
          iconSize={26}
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
