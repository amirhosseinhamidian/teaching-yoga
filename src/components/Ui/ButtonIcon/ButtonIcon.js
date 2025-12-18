'use client';
/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ImSpinner2 } from 'react-icons/im';

const IconButton = ({
  icon: Icon,
  onClick,
  size = 24,
  color, // رنگ اصلی کاستوم (برای دکمه در حالت هاور + آیکون در حالت عادی)
  hoverIconColor, // رنگ آیکون در حالت هاور
  className,
  loading = false,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // رنگ پس‌زمینه‌ی دکمه در حالت هاور
  const buttonStyle = isHovered && color ? { backgroundColor: color } : {};

  // رنگ آیکون (spinner یا icon)
  const computedIconColor = (() => {
    if (isHovered) {
      // در حالت هاور
      if (hoverIconColor) return hoverIconColor;
      if (color) return '#ffffff'; // اگر رنگ پس‌زمینه داریم، پیش‌فرض آیکون رو سفید می‌گیریم برای کنتراست
      return undefined; // بره روی کلاس‌های Tailwind
    } else {
      // در حالت عادی
      if (color) return color; // آیکون هم‌رنگ color
      return undefined; // بره روی کلاس‌های Tailwind
    }
  })();

  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyle}
      className={`group rounded-xl ${loading ? '' : 'hover:bg-secondary'} bg-background-light p-2 transition duration-300 ease-in dark:bg-background-dark ${className} `}
    >
      {loading ? (
        <ImSpinner2
          size={size}
          style={computedIconColor ? { color: computedIconColor } : {}}
          className={`animate-spin ${
            computedIconColor ? '' : 'text-secondary'
          }`}
        />
      ) : (
        <Icon
          data-testid='icon'
          size={size}
          style={computedIconColor ? { color: computedIconColor } : {}}
          className={
            computedIconColor
              ? '' // وقتی رنگ رو با style کنترل می‌کنیم، کلاس رنگی Tailwind نمی‌دیم
              : 'fill-primary transition-colors duration-300 group-hover:fill-secondary-light dark:group-hover:fill-secondary-dark'
          }
        />
      )}
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  size: PropTypes.number,
  color: PropTypes.string, // رنگ دکمه در هاور + رنگ آیکون در حالت عادی
  hoverIconColor: PropTypes.string, // رنگ آیکون در هاور
  className: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default IconButton;
