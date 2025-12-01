'use client';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const Input = React.forwardRef(
  (
    {
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
      maxLength,
      thousandSeparator = false,
      fontDefault = true,
      isUppercase = false,
      isShowCounter = false,
      onEnterPress,
    },
    ref
  ) => {
    // تابع فرمت جداکننده هزارگان
    const formatWithThousandSeparator = (num) => {
      if (!num) return '';
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const [displayValue, setDisplayValue] = useState(
      thousandSeparator ? formatWithThousandSeparator(value) : value
    );

    // همگام‌سازی displayValue با value
    useEffect(() => {
      setDisplayValue(
        thousandSeparator ? formatWithThousandSeparator(value) : value
      );
    }, [value, thousandSeparator]);

    const convertToEnglishDigits = (str) => {
      return str
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))) // Persian
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))); // Arabic
    };

    const handleChange = (event) => {
      let rawValue = event.target.value.replace(/,/g, '');

      // تبدیل اعداد فارسی/عربی به انگلیسی
      rawValue = convertToEnglishDigits(rawValue);

      // تبدیل به uppercase
      if (isUppercase) {
        rawValue = rawValue.toUpperCase();
      }

      if (!maxLength || rawValue.length <= maxLength) {
        if (thousandSeparator) {
          setDisplayValue(formatWithThousandSeparator(rawValue));
        } else {
          setDisplayValue(rawValue);
        }
        onChange(rawValue);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && onEnterPress) {
        onEnterPress(event);
      }
    };

    return (
      <div className={`flex flex-col ${fullWidth ? 'w-full' : ''}`}>
        <div className='flex items-end justify-between'>
          {label && (
            <label className='mb-2 mr-4 block text-sm font-medium text-text-light dark:text-text-dark'>
              {label}
            </label>
          )}

          {isShowCounter && maxLength && (
            <div className='ml-4 font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        <input
          ref={ref} // اضافه کردن ref به تگ input
          autoFocus={focus}
          type={type}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={`rounded-xl border border-solid ${errorMessage ? 'border-red focus:ring-red' : 'border-accent focus:ring-accent'} bg-background-light px-4 py-2 ${fontDefault ? 'font-faNa' : 'font-main'} font-medium transition duration-200 ease-in placeholder:text-subtext-light focus:outline-none focus:ring-1 dark:bg-background-dark placeholder:dark:text-subtext-dark ${className}`}
        />
        {errorMessage && (
          <p className={`mt-1 text-xs text-red ${errorClassName}`}>
            *{errorMessage}
          </p>
        )}
      </div>
    );
  }
);

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
  maxLength: PropTypes.number,
  thousandSeparator: PropTypes.bool,
  fontDefault: PropTypes.bool,
  isUppercase: PropTypes.bool,
  isShowCounter: PropTypes.bool,
  onEnterPress: PropTypes.func,
};

Input.displayName = 'Input'; // لازم برای React.forwardRef

export default Input;
