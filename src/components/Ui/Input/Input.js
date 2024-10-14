/* eslint-disable react/prop-types */
import React from 'react';

const Input = ({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  className = '',
  fullWidth = false,
  errorMessage = '',
  label = '',
}) => {
  return (
    <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className='mb-2 mr-4 block font-medium text-text-light dark:text-text-dark '>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-xl border border-solid border-accent bg-background-light px-4 py-2 font-medium text-subtext-light transition duration-300 ease-in focus:outline-none focus:ring-1 focus:ring-accent dark:bg-background-dark ${className}`}
      />
      {errorMessage && (
        <p className='text-red mt-1 mr-3 text-xs'>*{errorMessage}</p>
      )}
    </div>
  );
};

export default Input;
