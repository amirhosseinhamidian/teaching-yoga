import React from 'react';
import PropTypes from 'prop-types';

const SimpleDropdown = ({ options = [], value, onChange, className }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='block w-full bg-transparent px-3 py-2 focus:outline-none'
      >
        {options.map((option, index) => (
          <option
            key={index}
            value={option.value}
            className='bg-background-light dark:bg-background-dark'
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

SimpleDropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default SimpleDropdown;
