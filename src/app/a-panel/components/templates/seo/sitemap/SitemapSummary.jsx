'use client';
import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../../modules/CardInfo/CardInfo';
import { FaSitemap } from 'react-icons/fa6';
import { MdOutlineUpdate } from 'react-icons/md';
import { getShamsiDate } from '@/utils/dateTimeHelper';

const SitemapSummary = ({ sitemapInfo, isLoading, className }) => {
  return (
    <div className={className}>
      <div className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3`}>
        <CardInfo
          icon={MdOutlineUpdate}
          title='آخرین به روزرسانی'
          value={`${getShamsiDate(sitemapInfo?.lastUpdate)}`}
          isLoading={isLoading}
        />
        <CardInfo
          icon={FaSitemap}
          title='تعداد صفحات'
          value={sitemapInfo?.pageCount}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

SitemapSummary.propTypes = {
  className: PropTypes.string,
  sitemapInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default SitemapSummary;
