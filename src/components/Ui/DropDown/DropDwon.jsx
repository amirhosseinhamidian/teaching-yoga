import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoIosArrowDown } from 'react-icons/io';

const DropDown = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  errorMessage = '',
  errorClassName = 'mr-3',
  label = '',
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null); // Reference to the dropdown container

  // Toggle the dropdown open/close
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close the dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false); // Close dropdown if click is outside
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}
      ref={dropdownRef}
    >
      {label && (
        <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
          {label}
        </label>
      )}
      <div
        className={`relative rounded-xl border border-solid ${
          errorMessage ? 'border-red' : 'border-accent'
        } bg-surface-light px-4 py-2 font-faNa font-medium text-subtext-light transition duration-200 ease-in focus-within:outline-none focus-within:ring-1 dark:bg-surface-dark dark:text-subtext-dark ${
          isOpen ? 'ring-1 ring-accent' : ''
        } ${className}`}
        onClick={toggleDropdown}
      >
        {/* Placeholder or Selected Value */}
        <div
          className={`flex cursor-pointer items-center justify-between transition-all ${
            value
              ? 'text-sm font-medium text-text-light dark:text-subtext-dark'
              : 'text-sm text-gray-400'
          }`}
        >
          <span>
            {value
              ? options.find((opt) => opt.value === value)?.label
              : placeholder}
          </span>
          {/* Dropdown Icon */}
          <IoIosArrowDown
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
              errorMessage ? 'text-red' : 'text-accent'
            }`}
          />
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <ul
            className={`absolute right-0 z-10 mt-3 w-full rounded-xl bg-surface-light p-2 shadow-lg transition-all duration-300 ease-in-out dark:bg-surface-dark`}
          >
            {options.map((option, index) => (
              <li
                key={index}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false); // Close dropdown after selecting an option
                }}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm text-subtext-light hover:bg-foreground-light hover:text-text-light dark:text-subtext-dark dark:hover:bg-foreground-dark hover:dark:text-text-dark`}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {errorMessage && (
        <p className={`mt-1 text-xs text-red ${errorClassName}`}>
          *{errorMessage}
        </p>
      )}
    </div>
  );
};

DropDown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  errorMessage: PropTypes.string,
  errorClassName: PropTypes.string,
  label: PropTypes.string,
  fullWidth: PropTypes.bool,
};

export default DropDown;
