import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../../modules/CardInfo/CardInfo';
import { FaBoxesStacked } from 'react-icons/fa6';
import { PiWarningFill } from 'react-icons/pi';
import { BsClipboard2CheckFill, BsClipboard2XFill } from 'react-icons/bs';

const ProductSummarySection = ({ info, isLoading, className }) => {
  return (
    <section className={className}>
      <h2 className='mb-3 text-sm font-semibold xs:text-base md:text-lg'>
        خلاصه محصولات
      </h2>

      <div className='grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4'>
        <CardInfo
          icon={FaBoxesStacked}
          title='کل محصولات'
          value={info.total}
          isLoading={isLoading}
        />
        <CardInfo
          icon={BsClipboard2CheckFill}
          title='محصولات فعال'
          value={info.active}
          isLoading={isLoading}
        />
        <CardInfo
          icon={PiWarningFill}
          title='کم‌موجودی'
          value={info.lowStock}
          isLoading={isLoading}
        />
        <CardInfo
          icon={BsClipboard2XFill}
          title='ناموجودها'
          value={info.outOfStock}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
};

ProductSummarySection.propTypes = {
  className: PropTypes.string,
  info: PropTypes.shape({
    total: PropTypes.number,
    active: PropTypes.number,
    lowStock: PropTypes.number,
    outOfStock: PropTypes.number,
  }).isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default ProductSummarySection;
