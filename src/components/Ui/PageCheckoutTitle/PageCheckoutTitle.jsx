import React from 'react';
import PropTypes from 'prop-types';

function PageCheckoutTitle({ children, icon: Icon, isSuccess }) {
  return (
    <div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
      <Icon
        size={46}
        className={`${isSuccess ? 'text-secondary' : 'text-red'}`}
      />
      <h1
        className={`my-4 text-lg font-semibold ${isSuccess ? 'text-secondary' : 'text-red'} md:my-8 md:text-2xl`}
      >
        {children}
      </h1>
    </div>
  );
}

PageCheckoutTitle.propTypes = {
  children: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  isSuccess: PropTypes.bool.isRequired,
};

export default PageCheckoutTitle;
