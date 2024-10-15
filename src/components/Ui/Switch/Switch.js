import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Switch = ({
  checked = false,
  onChange,
  size = 'medium',
  className,
  label,
  labelClass,
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    setIsChecked(!isChecked);
    if (onChange) {
      onChange(!isChecked);
    }
  };

  const sizeClasses = {
    small: 'w-86 h-5',
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
        <span
          className={`mr-3 text-text-light dark:text-text-dark ${labelClass}`}
        >
          {label}
        </span>
      )}
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
          className={`block cursor-pointer rounded-full ${backgroundClasses[size]} transition-colors duration-300 ${
            isChecked ? 'bg-secondary' : 'bg-subtext-dark'
          }`}
        ></span>
        <span
          className={`absolute left-0 transform rounded-full bg-white transition-transform duration-300 ${handleClasses[size]} ${
            isChecked ? 'translate-x-full' : 'translate-x-0'
          }`}
        ></span>
      </label>
    </div>
  );
};

// Define the PropTypes
Switch.propTypes = {
  checked: PropTypes.bool, // Initial state of the switch
  onChange: PropTypes.func, // Callback for when the switch is toggled
  size: PropTypes.oneOf(['small', 'medium', 'large']), // Size of the switch
  className: PropTypes.string, // Custom class names
  labelClass: PropTypes.string, // Custom class names
  label: PropTypes.string, // Optional label text
};

export default Switch;
