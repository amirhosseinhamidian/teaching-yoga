import React from 'react';
import PropTypes from 'prop-types';

import EmptyState from '@/components/SiteUi/EmptyState/EmptyState';

import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

const EmptyComment = ({ isCourse, className = '' }) => {
  return (
    <EmptyState
      icon={HiOutlineChatBubbleLeftRight}
      eyebrow='شروع یک گفت‌وگوی تازه'
      title='هنوز دیدگاهی ثبت نشده است'
      description={`اولین نفری باش که تجربه یا سؤال خودت را درباره این ${
        isCourse ? 'دوره' : 'مقاله'
      } با دیگر کاربران به اشتراک می‌گذاری.`}
      className={className}
    />
  );
};

EmptyComment.propTypes = {
  isCourse: PropTypes.bool.isRequired,

  className: PropTypes.string,
};

export default EmptyComment;
