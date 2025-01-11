import React from 'react';
import PropTypes from 'prop-types';
import { ImSpinner2 } from 'react-icons/im';

const CardInfo = ({
  icon: Icon,
  title,
  value,
  isLoading,
  isCurrency = false,
  className,
}) => {
  return (
    <>
      {isLoading ? (
        <div className='flex h-32 items-center justify-center bg-surface-light sm:h-44 md:h-48 xl:h-56 dark:bg-surface-dark'>
          <ImSpinner2 size={42} className='animate-spin text-primary' />
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-evenly gap-3 rounded-xl bg-surface-light p-3 sm:p-6 dark:bg-surface-dark ${className}`}
        >
          <Icon
            size={128}
            className='max-h-6 min-h-6 min-w-6 max-w-6 text-subtext-light sm:max-h-10 sm:max-w-10 md:max-h-12 md:max-w-12 lg:max-h-16 lg:max-w-16 dark:text-subtext-dark'
          />
          <h4 className='text-xs font-medium text-subtext-light sm:text-base lg:text-lg dark:text-subtext-dark'>
            {title}
          </h4>
          <div className='flex items-baseline gap-2'>
            <h3 className='font-faNa text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl'>
              {value}
            </h3>
            {isCurrency && <span className='text-2xs sm:text-xs'>تومان</span>}
          </div>
        </div>
      )}
    </>
  );
};

CardInfo.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  isCurrency: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default CardInfo;
