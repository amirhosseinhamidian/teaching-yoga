import React from 'react';
import PropTypes from 'prop-types';
import { ImSpinner2 } from 'react-icons/im';

const colors = {
  primary: 'text-text-light bg-primary',
  secondary: 'bg-secondary text-text-light',
  red: 'bg-red text-background-light',
  blue: 'bg-blue text-background-light',
  accent: 'bg-accent text-background-light',
  green: 'bg-green text-background-light',
};

const Button = ({
  children,
  onClick,
  type = 'button',
  className = '',
  shadow = false,
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
      className={`rounded-xl px-2 py-2 disabled:opacity-70 sm:px-6 lg:cursor-pointer ${shadow ? 'shadow-[1px_5px_14px_rgba(255,175,41,0.4)]' : ''} font-main font-medium ${colorClasses} ${isLoading ? 'flex items-center justify-center gap-1' : ''} ${className}`}
    >
      {children}
      {isLoading && <ImSpinner2 className='animate-spin' />}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  shadow: PropTypes.bool,
  color: PropTypes.string,
  disable: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default Button;
