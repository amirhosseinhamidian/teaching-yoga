import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../../modules/CardInfo/CardInfo';
import { PiClockCountdownFill } from 'react-icons/pi';
import { RiInboxArchiveFill } from 'react-icons/ri';
import { MdLocalShipping } from 'react-icons/md';

const OrderSummarySection = ({ info, isLoading, className }) => {
  return (
    <section className={className}>
      <h2 className='mb-3 text-sm font-semibold xs:text-base md:text-lg'>
        خلاصه سفارش‌ها
      </h2>
      <div className='grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3'>
        <CardInfo
          icon={PiClockCountdownFill}
          title='سفارش‌های در انتظار پرداخت'
          value={info.pendingPayment}
          isLoading={isLoading}
        />
        <CardInfo
          icon={RiInboxArchiveFill}
          title='در حال پردازش / آماده‌سازی'
          value={info.inProgress}
          isLoading={isLoading}
        />
        <CardInfo
          icon={MdLocalShipping}
          title='ارسال‌شده و تحویل‌شده (۳۰ روز)'
          value={info.shippedOrDeliveredLast30Days}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
};

OrderSummarySection.propTypes = {
  className: PropTypes.string,
  info: PropTypes.shape({
    pendingPayment: PropTypes.number,
    inProgress: PropTypes.number,
    shippedOrDeliveredLast30Days: PropTypes.number,
  }).isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default OrderSummarySection;
