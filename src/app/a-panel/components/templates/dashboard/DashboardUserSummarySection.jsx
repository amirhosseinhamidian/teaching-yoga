import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { FaSitemap } from 'react-icons/fa';
import { BsCalendarCheckFill, BsCalendarFill } from 'react-icons/bs';

const DashboardUserSummarySection = ({ userInfo, isLoading, className }) => {
  return (
    <div className={className}>
      <h2 className='mb-3 text-base font-semibold md:text-lg lg:text-xl xl:text-2xl'>
        وضعیت کاربران
      </h2>
      <div className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3`}>
        <CardInfo
          icon={FaSitemap}
          title='کل ثبت نام های سایت'
          value={userInfo?.totalUsers}
          isLoading={isLoading}
        />
        <CardInfo
          icon={BsCalendarFill}
          title='ثبت نام های ۳۰ روز گذشته'
          value={userInfo?.totalNewUsersLast30Days}
          isLoading={isLoading}
        />
        <CardInfo
          icon={BsCalendarCheckFill}
          title='کاربران فعال ۳۰ روز گذشته'
          value={userInfo?.totalActiveUsersLast30Days}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

DashboardUserSummarySection.propTypes = {
  className: PropTypes.string,
  userInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default DashboardUserSummarySection;
