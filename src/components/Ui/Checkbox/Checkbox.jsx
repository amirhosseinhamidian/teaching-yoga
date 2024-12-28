import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Checkbox = ({
  checked = false,
  onChange,
  size = 'medium',
  className,
  label,
  labelClass,
  color = 'accent',
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    setIsChecked(!isChecked);
    if (onChange) {
      onChange(!isChecked);
    }
  };

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const backgroundClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const checkmarkClasses = {
    small: 'w-3 h-3',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <label
        className={`relative flex items-center justify-center ${sizeClasses[size]}`}
      >
        <input
          type='checkbox'
          checked={isChecked}
          onChange={handleToggle}
          className='sr-only'
        />
        <span
          className={`relative block cursor-pointer rounded-sm ${backgroundClasses[size]} transition-colors duration-300 ${
            isChecked ? `bg-${color}` : `border border-${color}`
          }`}
        ></span>
        {isChecked && (
          <span
            className={`absolute left-0.5 top-0.5 flex items-center justify-center rounded-full bg-transparent transition-transform duration-300 ${checkmarkClasses[size]}`}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='4'
              className='flex h-4 w-4 items-center justify-center text-white'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M5 13l4 4L19 7'
              />
            </svg>
          </span>
        )}
      </label>
      {label && (
        <span
          className={`mr-2 text-text-light dark:text-text-dark ${labelClass}`}
        >
          {label}
        </span>
      )}
    </div>
  );
};

// Define the PropTypes
Checkbox.propTypes = {
  checked: PropTypes.bool, // Initial state of the checkbox
  onChange: PropTypes.func, // Callback for when the checkbox is toggled
  size: PropTypes.oneOf(['small', 'medium', 'large']), // Size of the checkbox
  className: PropTypes.string, // Custom class names
  labelClass: PropTypes.string, // Custom class names for label
  label: PropTypes.string, // Optional label text
  color: PropTypes.string, // Optional color
};

export default Checkbox;
