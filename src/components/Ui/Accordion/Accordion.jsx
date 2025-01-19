'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

const Accordion = ({
  title,
  subtitle,
  content,
  info1,
  info2,
  actionLeftContent,
  className,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = (e) => {
    e.stopPropagation(); // جلوگیری از تاثير کلیک بر روی دیگر بخش‌ها
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState); // فراخوانی تابع در هنگام تغییر وضعیت
    }
  };

  // جلوگیری از تاثیر کلیک روی actionLeftContent بر روی اکاردیون
  const handleActionClick = (e) => {
    e.stopPropagation(); // جلوگیری از بروز تغییر در وضعیت اکاردیون
    // در اینجا می‌توانید رفتارهای خاص خود را برای actionLeftContent پیاده‌سازی کنید
  };

  return (
    <div
      className={`w-full rounded-xl bg-background-light p-4 dark:bg-background-dark ${className}`}
    >
      <button
        className='flex w-full items-center justify-between gap-2 text-left focus:outline-none'
        onClick={toggleAccordion}
      >
        <div className='flex flex-col items-start gap-2'>
          <span className='text-start font-faNa text-sm font-medium sm:text-base'>
            {title}
          </span>
          <span className='text-start font-faNa text-xs font-light text-subtext-light sm:text-sm dark:text-subtext-dark'>
            {subtitle}
          </span>
          {(info1 || info2) && (
            <div className='mt-2 flex flex-wrap gap-2'>
              {info1 && (
                <span className='rounded-full border border-gray-400 px-2 py-1 text-start font-faNa text-2xs text-subtext-light md:text-xs dark:text-subtext-dark'>
                  {info1}
                </span>
              )}
              {info2 && (
                <span className='rounded-full border border-gray-400 px-2 py-1 text-start font-faNa text-2xs text-subtext-light md:text-xs dark:text-subtext-dark'>
                  {info2}
                </span>
              )}
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {actionLeftContent && (
            <div onClick={handleActionClick}>
              {' '}
              {/* متوقف کردن رویداد کلیک برای actionLeftContent */}
              {actionLeftContent}
            </div>
          )}

          {isOpen ? (
            <IoIosArrowUp
              className='text-subtext-light md:text-lg dark:text-subtext-dark'
              aria-label='up arrow'
            />
          ) : (
            <IoIosArrowDown
              className='text-subtext-light md:text-lg dark:text-subtext-dark'
              aria-label='down arrow'
            />
          )}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-fit opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className='mt-2 border-t border-gray-300 py-2 text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300'>
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
  addTitle: PropTypes.string,
  actionLeftContent: PropTypes.node, // تغییر نوع به node برای دکمه
  content: PropTypes.string.isRequired,
  onToggle: PropTypes.func,
};

export default Accordion;
