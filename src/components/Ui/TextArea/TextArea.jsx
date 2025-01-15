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
  maxLength,
}) => {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      <div className='flex items-end justify-between'>
        {label && (
          <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
            {label}
          </label>
        )}

        {maxLength && (
          <div className='ml-4 font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          if (!maxLength || event.target.value.length <= maxLength) {
            onChange(event.target.value);
          }
        }}
        rows={rows}
        className={`w-full rounded-xl border border-solid ${
          errorMessage
            ? 'border-red focus:ring-red'
            : 'border-accent focus:ring-accent'
        } bg-background-light px-4 py-2 text-text-light transition duration-200 ease-in placeholder:text-subtext-light focus:outline-none focus:ring-1 dark:bg-background-dark dark:text-text-dark placeholder:dark:text-subtext-dark ${className}`}
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
  maxLength: PropTypes.number,
};

export default TextArea;
