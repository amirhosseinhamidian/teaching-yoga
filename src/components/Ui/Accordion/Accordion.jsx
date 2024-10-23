'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

const Accordion = ({ title, subtitle, content, info1, info2, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`w-full rounded-xl bg-background-light p-4 dark:bg-background-dark ${className}`}>
      <button
          className='flex w-full items-center justify-between gap-2 py-4 text-left focus:outline-none'
          onClick={toggleAccordion}
        >
          <div className='flex flex-col items-start gap-2'>
            <span className='text-base font-semibold sm:text-lg font-faNa'>{title}</span>
            <span className='text-start text-xs text-subtext-light md:text-base dark:text-subtext-dark font-faNa'>
              {subtitle}
            </span>
          </div>
          <div className='flex min-w-28 items-center gap-3'>
            <div className='mt-2 flex flex-col gap-1'>
              <span className='text-start text-xs text-subtext-light md:text-base dark:text-subtext-dark font-faNa'>
                {info1}
              </span>
              <span className='text-start text-xs text-subtext-light md:text-base dark:text-subtext-dark font-faNa'>
                {info2}
              </span>
            </div>
            {isOpen ? (
              <IoIosArrowUp className='h-8 w-8 text-text-light dark:text-text-dark' />
            ) : (
              <IoIosArrowDown className='h-8 w-8 text-text-light dark:text-text-dark' />
            )}
          </div>
        </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className='py-2 text-sm text-gray-600 dark:text-gray-300'>
          {content}
        </div>
      </div>
    </div>
  );
};

Accordion.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  info1: PropTypes.string,
  info2: PropTypes.string,
  className: PropTypes.string,
  content: PropTypes.string.isRequired,
};

export default Accordion;
