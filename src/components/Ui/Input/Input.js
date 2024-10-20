import React from 'react';
import PropTypes from 'prop-types';

const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  fullWidth = false,
  errorMessage = '',
  label = '',
  focus = false,
}) => {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className='mb-2 mr-4 block font-medium text-text-light dark:text-text-dark'>
          {label}
        </label>
      )}
      <input
        autoFocus={focus}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${type === 'number' ? 'font-faNa' : ''} text-base placeholder:font-main rounded-xl border border-solid border-accent bg-background-light px-4 py-2 text-text-light transition duration-300 ease-in placeholder:text-subtext-light focus:outline-none focus:ring-1 focus:ring-accent dark:bg-background-dark dark:text-text-dark placeholder:dark:text-subtext-dark ${className}`}
      />
      {errorMessage && (
        <p className='mr-3 mt-1 text-xs text-red'>*{errorMessage}</p>
      )}
    </div>
  );
};

// Define PropTypes for the Input component
Input.propTypes = {
  type: PropTypes.string, // The type of the input, default is 'text'
  placeholder: PropTypes.string, // Placeholder text for the input
  value: PropTypes.string.isRequired, // The value of the input
  onChange: PropTypes.func.isRequired, // Function to call on input change
  className: PropTypes.string, // Additional custom classes for styling
  fullWidth: PropTypes.bool, // Whether the input should take full width
  errorMessage: PropTypes.string, // Error message to display under input
  label: PropTypes.string, // Optional label text for the input
  focus: PropTypes.bool, // Whether the input should be focused by default
};

export default Input;
