import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../../modules/CardInfo/CardInfo';
import { MdOutlinePointOfSale } from 'react-icons/md';
import { BsFillCartCheckFill } from 'react-icons/bs';
import { IoCalendarSharp } from 'react-icons/io5';

const ShopSalesSummarySection = ({ info, isLoading, className }) => {
  return (
    <section className={className}>
      <h2 className='mb-3 text-sm font-semibold xs:text-base md:text-lg'>
        خلاصه فروش فروشگاه
      </h2>
      <div className='grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3'>
        <CardInfo
          icon={MdOutlinePointOfSale}
          title='فروش کل'
          isCurrency
          value={(info.totalSales || 0).toLocaleString('fa-IR')}
          isLoading={isLoading}
        />
        <CardInfo
          icon={BsFillCartCheckFill}
          title='تعداد فروش موفق'
          value={info.totalSuccessfulTransactions}
          isLoading={isLoading}
        />
        <CardInfo
          icon={IoCalendarSharp}
          title='فروش ۳۰ روز گذشته'
          isCurrency
          value={(info.salesLast30Days || 0).toLocaleString('fa-IR')}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
};

ShopSalesSummarySection.propTypes = {
  className: PropTypes.string,
  info: PropTypes.shape({
    totalSales: PropTypes.number,
    totalSuccessfulTransactions: PropTypes.number,
    salesLast30Days: PropTypes.number,
  }).isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default ShopSalesSummarySection;
