import React from 'react';
import PropTypes from 'prop-types';

const colors = {
  primary: 'bg-primary shadow-[1px_3px_8px_rgba(254,205,26,0.4)]',
  secondary: 'bg-secondary shadow-[1px_3px_8px_rgba(255,175,41,0.4)]',
  red: 'bg-red shadow-[1px_3px_8px_rgba(248,37,37,0.4)]',
  blue: 'bg-blue shadow-[1px_3px_8px_rgba(37,164,248,0.4)]',
  accent: 'bg-accent shadow-[1px_3px_8px_rgba(100,244,171,0.4)]',
  green: 'bg-green shadow-[1px_3px_8px_rgba(50,122,86,0.4)]',
};

const ActionButtonIcon = ({
  icon: Icon,
  onClick,
  size = 16,
  color = 'primary',
  className,
}) => {
  const colorClasses = colors[color] || colors.primary;
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-2 transition duration-300 ease-in hover:opacity-70 ${colorClasses} ${className}`}
    >
      <Icon data-testid='icon' size={size} color='#fff' className='' />
    </button>
  );
};

ActionButtonIcon.propTypes = {
  icon: PropTypes.elementType.isRequired, // React element for the icon
  onClick: PropTypes.func, // Click handler
  size: PropTypes.number, // Size of the icon
  color: PropTypes.string, // Color of the icon
  className: PropTypes.string,
};

export default ActionButtonIcon;
