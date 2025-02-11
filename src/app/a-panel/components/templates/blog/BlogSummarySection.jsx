import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { RiArticleFill } from 'react-icons/ri';
import { FaEye } from 'react-icons/fa';
import { FaCalendar } from 'react-icons/fa';
import { FaCommentAlt } from 'react-icons/fa';

const BlogSummarySection = ({ blogInfo, isLoading, className }) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}
    >
      <CardInfo
        icon={FaEye}
        title='کل بازدیدها'
        value={blogInfo?.totalVisits}
        isLoading={isLoading}
      />
      <CardInfo
        icon={FaCommentAlt}
        title='تعداد نظرات'
        value={blogInfo?.totalComments}
        isLoading={isLoading}
      />
      <CardInfo
        icon={FaCalendar}
        title='بازدیدها در ۳۰ روز گذشته'
        value={blogInfo?.visitsLast30Days}
        isLoading={isLoading}
      />
      <CardInfo
        icon={RiArticleFill}
        title='تعداد مقالات'
        value={blogInfo?.totalArticles}
        isLoading={isLoading}
      />
    </div>
  );
};

BlogSummarySection.propTypes = {
  className: PropTypes.string,
  blogInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default BlogSummarySection;
