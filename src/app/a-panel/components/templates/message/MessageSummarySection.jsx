import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import { BiSolidMessageSquareDetail } from 'react-icons/bi';
import { BiSolidMessageSquareCheck } from 'react-icons/bi';
import { BiSolidMessageSquareError } from 'react-icons/bi';

const MessageSummarySection = ({ messageInfo, isLoading, className }) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 ${className}`}
    >
      <CardInfo
        icon={BiSolidMessageSquareError}
        title='پیام های جدید'
        value={messageInfo?.unseenMessages}
        isLoading={isLoading}
      />
      <CardInfo
        icon={BiSolidMessageSquareCheck}
        title='تعداد پاسخ ها'
        value={messageInfo?.supportReplies}
        isLoading={isLoading}
      />
      <CardInfo
        icon={BiSolidMessageSquareDetail}
        title='پیام های کاربران'
        value={messageInfo?.userMessages}
        isLoading={isLoading}
      />
    </div>
  );
};

MessageSummarySection.propTypes = {
  className: PropTypes.string,
  messageInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default MessageSummarySection;
