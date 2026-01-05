import React from 'react';
import PropTypes from 'prop-types';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import Button from '@/components/Ui/Button/Button';

const Modal = ({
  title,
  desc,
  icon: Icon,
  iconSize = 22,
  iconColor,
  primaryButtonClick,
  secondaryButtonClick,
  primaryButtonText = 'تایید',
  className = '',
  secondaryButtonText = 'انصراف',
  children,
  loadingPrimaryButton = false,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm ${className}`}
    >
      <div className='w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center gap-2 border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          {Icon ? <Icon size={iconSize} color={iconColor} /> : null}
          <h3 className='text-xs font-semibold sm:text-base'>{title}</h3>
        </div>

        {/* desc یا children */}
        {desc ? (
          <p className='py-4 text-xs font-light text-subtext-light sm:text-base dark:text-subtext-dark'>
            {desc}
          </p>
        ) : null}

        {children ? <div className='py-2'>{children}</div> : null}

        <div className='mt-8 flex flex-wrap-reverse items-center justify-center gap-2 xs:flex-nowrap xs:justify-end'>
          <OutlineButton
            onClick={secondaryButtonClick}
            className='text-xs sm:text-base'
          >
            {secondaryButtonText}
          </OutlineButton>
          <Button
            onClick={primaryButtonClick}
            className='text-xs sm:text-base'
            isLoading={loadingPrimaryButton}
          >
            {primaryButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node,
  icon: PropTypes.elementType, // ✅ optional شد
  primaryButtonClick: PropTypes.func,
  secondaryButtonClick: PropTypes.func,
  iconSize: PropTypes.number,
  iconColor: PropTypes.string,
  primaryButtonText: PropTypes.string,
  secondaryButtonText: PropTypes.string,
  className: PropTypes.string,
  loadingPrimaryButton: PropTypes.bool,
};

export default Modal;
