'use client';
import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const range = 1; // تعداد صفحات اطراف صفحه فعلی

    if (totalPages <= 3) {
      // اگر تعداد صفحات ۳ یا کمتر باشد، تمام صفحات نمایش داده می‌شوند
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // اضافه کردن صفحه اول و سه نقطه اگر نیاز باشد
      if (currentPage > range + 2) {
        pageNumbers.push(1, '...');
      }

      // اضافه کردن صفحات اطراف صفحه فعلی
      for (
        let i = Math.max(1, currentPage - range);
        i <= Math.min(totalPages, currentPage + range);
        i++
      ) {
        pageNumbers.push(i);
      }

      // اضافه کردن سه نقطه و صفحه آخر اگر نیاز باشد
      if (currentPage < totalPages - range - 1) {
        pageNumbers.push('...', totalPages);
      }
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className='mx-auto flex w-fit items-center justify-center rounded-2xl bg-surface-light text-2xs sm:text-xs md:text-base dark:bg-surface-dark'>
      {/* دکمه بعدی */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='rounded-lg px-4 py-2 disabled:opacity-45'
      >
        بعدی
      </button>

      {/* نمایش شماره صفحات */}
      <div className='flex flex-row-reverse space-x-2'>
        {pageNumbers.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`rounded-lg py-1 font-faNa ${
              currentPage === page
                ? 'bg-secondary px-2 sm:px-3'
                : 'px-1 sm:px-2'
            } ${page === '...' ? 'cursor-default px-0 opacity-50' : ''}`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* دکمه قبلی */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='rounded-lg px-2 py-2 disabled:opacity-45 sm:px-4'
      >
        قبلی
      </button>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
