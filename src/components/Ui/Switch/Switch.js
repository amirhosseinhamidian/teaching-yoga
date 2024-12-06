'use client';
import React from 'react';
import PropTypes from 'prop-types';

const Switch = ({
  checked = false,
  onChange,
  size = 'medium',
  className,
  label,
  labelClass,
}) => {
  const handleToggle = () => {
    if (onChange) {
      onChange(!checked); // مقدار جدید را به تابع والد ارسال کنید
    }
  };

  const sizeClasses = {
    small: 'w-8 h-5',
    medium: 'w-12 h-7',
    large: 'w-16 h-10',
  };

  const backgroundClasses = {
    small: 'w-8 h-3',
    medium: 'w-12 h-5',
    large: 'w-14 h-6',
  };

  const handleClasses = {
    small: 'w-4 h-4 shadow-md',
    medium: 'w-6 h-6 shadow-md',
    large: 'w-8 h-8 shadow-md',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <span className={`text-text-light dark:text-text-dark ${labelClass}`}>
          {label}
        </span>
      )}
      <label
        className={`relative flex cursor-pointer items-center justify-center ${sizeClasses[size]}`}
        onClick={handleToggle} // تغییر مقدار هنگام کلیک
      >
        <span
          className={`block cursor-pointer rounded-full ${backgroundClasses[size]} transition-colors duration-300 ${
            checked ? 'bg-secondary' : 'bg-subtext-dark'
          }`}
        ></span>
        <span
          className={`absolute left-0 transform rounded-full bg-foreground-light transition-transform duration-300 dark:bg-white ${handleClasses[size]} ${
            checked ? 'translate-x-full' : 'translate-x-0'
          }`}
        ></span>
      </label>
    </div>
  );
};

// Define the PropTypes
Switch.propTypes = {
  checked: PropTypes.bool, // مقدار اولیه
  onChange: PropTypes.func, // تابع تغییر وضعیت
  size: PropTypes.oneOf(['small', 'medium', 'large']), // سایز
  className: PropTypes.string, // کلاس‌های اضافی
  labelClass: PropTypes.string, // کلاس‌های لیبل
  label: PropTypes.string, // لیبل اختیاری
};

export default Switch;
