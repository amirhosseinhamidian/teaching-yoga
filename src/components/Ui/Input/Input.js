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
  errorClassName = 'mr-3',
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
        className={`rounded-xl border border-solid ${errorMessage ? 'border-red focus:ring-red' : 'border-accent focus:ring-accent'} bg-background-light px-4 py-2 font-medium text-subtext-light transition duration-200 ease-in focus:outline-none focus:ring-1 dark:bg-background-dark ${className}`}
      />
      {errorMessage && (
        <p className={`mt-1 text-xs text-red ${errorClassName}`}>*{errorMessage}</p>
      )}
    </div>
  );
};

Input.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  errorClassName: PropTypes.string,
  fullWidth: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  type: PropTypes.string,
  focus: PropTypes.bool,
};

export default Input;
