import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { RiFolderVideoFill } from 'react-icons/ri';
import { GiArchiveRegister } from 'react-icons/gi';
import { PiMonitorPlayFill } from 'react-icons/pi';

const DashboardCourseSummarySection = ({
  courseInfo,
  isLoading,
  className,
}) => {
  return (
    <div className={className}>
      <h2 className='mb-3 text-base font-semibold md:text-lg lg:text-xl xl:text-2xl'>
        وضعیت دوره ها
      </h2>
      <div className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3`}>
        <CardInfo
          icon={RiFolderVideoFill}
          title='دوره های فعال'
          value={courseInfo?.totalActiveCourses}
          isLoading={isLoading}
        />
        <CardInfo
          icon={GiArchiveRegister}
          title='تعداد ثبت نام دوره ها'
          value={courseInfo?.totalEnrollments}
          isLoading={isLoading}
        />
        <CardInfo
          icon={PiMonitorPlayFill}
          title='تعداد جلسات دیده شده '
          value={courseInfo?.totalCompletedVideos}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

DashboardCourseSummarySection.propTypes = {
  className: PropTypes.string,
  courseInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default DashboardCourseSummarySection;
