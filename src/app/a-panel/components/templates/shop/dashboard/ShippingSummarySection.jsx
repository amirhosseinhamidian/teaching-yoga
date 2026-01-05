import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../../modules/CardInfo/CardInfo';
import { BsBoxSeamFill, BsClipboard2MinusFill } from 'react-icons/bs';
import { HiClipboardCopy } from 'react-icons/hi';

const ShippingSummarySection = ({ info, isLoading, className }) => {
  return (
    <section className={className}>
      <h2 className='mb-3 text-sm font-semibold xs:text-base md:text-lg'>
        وضعیت ارسال و پیگیری
      </h2>

      <div className='grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3'>
        <CardInfo
          icon={BsBoxSeamFill}
          title='سفارش‌های آماده ارسال'
          value={info.readyToShip}
          isLoading={isLoading}
        />
        <CardInfo
          icon={BsClipboard2MinusFill}
          title='بدون کد رهگیری'
          value={info.shippedNoTracking}
          isLoading={isLoading}
        />
        <CardInfo
          icon={HiClipboardCopy}
          title='مرجوعی‌ها'
          value={info.returned}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
};

ShippingSummarySection.propTypes = {
  className: PropTypes.string,
  info: PropTypes.shape({
    readyToShip: PropTypes.number,
    shippedNoTracking: PropTypes.number,
    returned: PropTypes.number,
  }).isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default ShippingSummarySection;
