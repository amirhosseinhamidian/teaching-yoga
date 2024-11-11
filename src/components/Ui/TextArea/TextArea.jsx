import React from 'react';
import PropTypes from 'prop-types';

const TextArea = ({
  placeholder = '',
  value,
  onChange,
  className = '',
  fullWidth = false,
  errorMessage = '',
  errorClassName = 'mr-3',
  label = '',
  rows = 4,
}) => {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className='mb-2 mr-4 block font-medium text-text-light dark:text-text-dark'>
          {label}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className={`rounded-xl border border-solid ${errorMessage ? 'border-red focus:ring-red' : 'border-accent focus:ring-accent'} bg-background-light px-4 py-2 font-medium text-text-light transition duration-200 ease-in focus:outline-none focus:ring-1 dark:bg-background-dark dark:text-text-dark ${className}`}
      />
      {errorMessage && (
        <p className={`mt-1 text-xs text-red ${errorClassName}`}>
          *{errorMessage}
        </p>
      )}
    </div>
  );
};

TextArea.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  errorClassName: PropTypes.string,
  fullWidth: PropTypes.bool,
  errorMessage: PropTypes.string,
  label: PropTypes.string,
  rows: PropTypes.number,
};

export default TextArea;
