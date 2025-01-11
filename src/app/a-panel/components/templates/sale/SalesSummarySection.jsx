import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { MdOutlinePointOfSale } from 'react-icons/md';
import { BsFillCartCheckFill } from 'react-icons/bs';
import { IoCalendarSharp } from 'react-icons/io5';

const SalesSummarySection = ({ saleInfo, isLoading, className }) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 ${className}`}
    >
      <CardInfo
        icon={MdOutlinePointOfSale}
        title='کل فروش'
        isCurrency
        value={saleInfo.totalSales?.toLocaleString('fa-IR')}
        isLoading={isLoading}
      />
      <CardInfo
        icon={BsFillCartCheckFill}
        title='تعداد فروش دوره آفلاین'
        value={saleInfo.totalTransactions}
        isLoading={isLoading}
      />
      <CardInfo
        icon={IoCalendarSharp}
        title='فروش در ۳۰ روز گذشته'
        isCurrency
        value={saleInfo.salesLast30Days?.toLocaleString('fa-IR')}
        isLoading={isLoading}
      />
    </div>
  );
};

SalesSummarySection.propTypes = {
  className: PropTypes.string,
  saleInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default SalesSummarySection;
