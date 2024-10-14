/* eslint-disable no-unused-vars */

import React from 'react';
import PropTypes from 'prop-types';

// Button component that accepts an icon via props
const IconButton = ({
  icon: Icon,
  onClick,
  size = 24,
  color = '#FFAF29',
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={`group rounded-xl bg-background-light p-2 transition duration-300 ease-in hover:bg-secondary dark:bg-background-dark ${className}`}
    >
      <Icon
        data-testid="icon"
        size={size}
        color={color}
        className='fill-primary transition-colors duration-300 group-hover:fill-secondary-light dark:group-hover:fill-secondary-dark'
      />
    </button>
  );
};

// Prop types for IconButton
IconButton.propTypes = {
  icon: PropTypes.elementType.isRequired, // React element for the icon
  onClick: PropTypes.func, // Click handler
  size: PropTypes.number, // Size of the icon
  color: PropTypes.string, // Color of the icon
  className: PropTypes.string,
  hoverIconColor: PropTypes.string,
};

export default IconButton;
