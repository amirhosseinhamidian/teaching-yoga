'use client';
import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Maximum number of pages to display for larger screens (set to 5 if totalPages exceeds 5)
  const maxPages = totalPages > 5 ? 5 : totalPages; // If totalPages is greater than 5, limit to 5

  // Function to generate page numbers based on the current page and total pages
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const range = 3; // Number of pages to display on mobile screens

    if (totalPages <= maxPages) {
      // If the total number of pages is less than or equal to maxPages, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // If the total number of pages is greater than maxPages, handle page ranges
      if (currentPage <= range) {
        // If the current page is near the start, show the first few pages
        for (let i = 1; i <= range; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - range + 1) {
        // If the current page is near the end, show the last few pages
        for (let i = totalPages - range + 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // If the current page is in the middle, show previous, current, and next pages
        pageNumbers.push(currentPage - 1, currentPage, currentPage + 1);
      }
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className='mx-auto flex w-fit items-center justify-center rounded-2xl bg-surface-light dark:bg-surface-dark'>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages} // Disable the next button if it's the last page
        className='rounded-lg px-4 py-2 text-sm disabled:opacity-45 sm:text-base'
      >
        بعدی
      </button>
      {/* Display the page numbers */}
      <div className='flex flex-row-reverse space-x-2'>
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`rounded-lg px-3 py-1 font-faNa text-sm sm:text-base ${currentPage === page ? 'bg-secondary' : ''}`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1} // Disable the previous button if it's the first page
        className='rounded-lg px-4 py-2 text-sm disabled:opacity-45 sm:text-base'
      >
        قبلی
      </button>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired, // Current active page number
  totalPages: PropTypes.number.isRequired, // Total number of pages
  onPageChange: PropTypes.func.isRequired, // Function to handle page changes
};

export default Pagination;
