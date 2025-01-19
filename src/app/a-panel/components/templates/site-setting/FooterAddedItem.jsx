import React from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';

const FooterAddedItem = ({ data, onDelete, isShowValue }) => {
  return (
    <div className='mx-2 my-3 flex w-full items-center gap-2'>
      <IoClose
        size={24}
        className='h-6 w-6 text-red md:cursor-pointer'
        onClick={() => onDelete(data.value)}
      />
      <p className='text-xs text-subtext-light sm:text-sm lg:text-base dark:text-subtext-dark'>
        {data.label}
      </p>
      {isShowValue && (
        <p className='text-xs text-subtext-light sm:text-sm lg:text-base dark:text-subtext-dark'>
          {data.value}
        </p>
      )}
    </div>
  );
};

FooterAddedItem.propTypes = {
  data: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  isShowValue: PropTypes.bool,
};

export default FooterAddedItem;
