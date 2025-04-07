import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { LuBookHeadphones } from 'react-icons/lu';
import { BsMicFill } from 'react-icons/bs';
import { FaCalendarCheck } from 'react-icons/fa';

const PodcastSummarySection = ({ podcastInfo, isLoading, className }) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 ${className}`}
    >
      <CardInfo
        icon={BsMicFill}
        title='کل اپیزودها'
        value='23'
        isLoading={isLoading}
      />
      <CardInfo
        icon={LuBookHeadphones}
        title='تعداد کل دانلود ها'
        value='1.8K'
        isLoading={isLoading}
      />
      <CardInfo
        icon={FaCalendarCheck}
        title='اپیزودها در ۳۰ روز گذشته'
        value='4'
        isLoading={isLoading}
      />
    </div>
  );
};

PodcastSummarySection.propTypes = {
  className: PropTypes.string,
  podcastInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default PodcastSummarySection;
