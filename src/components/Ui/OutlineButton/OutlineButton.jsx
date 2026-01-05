import React from 'react';
import PropTypes from 'prop-types';
import { ImSpinner2 } from 'react-icons/im';

const colors = {
  primary: 'text-primary border-primary hover:bg-primary hover:text-text-light',
  secondary:
    'text-secondary border-secondary hover:bg-secondary hover:text-text-light',
  red: 'text-red border-red hover:bg-red hover:text-background-light',
  blue: 'text-blue border-blue hover:bg-blue hover:text-background-light',
  accent:
    'text-accent border-accent hover:bg-accent hover:text-background-light',
  green:
    'text-green-light dark:text-green-dark border-green-light dark:border-green-dark hover:bg-green-light dark:hover:bg-green-dark hover:text-background-light',
  subtext:
    'text-subtext-light border-subtext-light hover:bg-primary hover:text-text-light hover:border-primary dark:text-subtext-dark dark:border-subtext-dark',
};

const OutlineButton = ({
  children,
  onClick,
  type = 'button',
  className = '',
  color = 'primary',
  disable = false,
  isLoading = false,
}) => {
  const colorClasses = colors[color] || colors.primary;

  return (
    <button
      disabled={disable || isLoading}
      type={type}
      onClick={onClick}
      className={`flex items-center gap-1 ${!className.includes('rounded-') ? 'rounded-xl' : ''} ${!className.includes('border') ? 'border-2' : ''} ${!className.includes('px-') ? 'px-6' : ''} ${!className.includes('py-') ? 'py-2' : ''} font-main font-medium transition-all duration-300 ease-in-out disabled:opacity-70 ${colorClasses} ${className}`}
    >
      {isLoading && <ImSpinner2 className='animate-spin' />}
      {children}
    </button>
  );
};

OutlineButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  color: PropTypes.string,
  disable: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default OutlineButton;
