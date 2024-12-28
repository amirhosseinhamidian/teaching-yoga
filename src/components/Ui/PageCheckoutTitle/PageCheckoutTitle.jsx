import React from 'react';
import PropTypes from 'prop-types';

function PageCheckoutTitle({ children, icon: Icon }) {
  return (
    <div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
      <Icon size={46} className='text-secondary' />
      <h1 className='my-4 text-lg font-semibold text-secondary md:my-8 md:text-2xl'>
        {children}
      </h1>
    </div>
  );
}

PageCheckoutTitle.propTypes = {
  children: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

export default PageCheckoutTitle;
