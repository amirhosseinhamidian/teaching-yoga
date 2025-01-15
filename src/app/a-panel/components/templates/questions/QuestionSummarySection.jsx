import React from 'react';
import PropTypes from 'prop-types';
import CardInfo from '../../modules/CardInfo/CardInfo';
import {
  BiSolidMessageRoundedCheck,
  BiSolidMessageRoundedDetail,
  BiSolidMessageRoundedX,
} from 'react-icons/bi';

const QuestionSummarySection = ({ questionInfo, isLoading, className }) => {
  return (
    <div
      className={`grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-3 ${className}`}
    >
      <CardInfo
        icon={BiSolidMessageRoundedDetail}
        title='کل سوالات'
        value={questionInfo.totalQuestions}
        isLoading={isLoading}
      />
      <CardInfo
        icon={BiSolidMessageRoundedX}
        title='پاسخ داده نشده'
        value={questionInfo.unansweredQuestions}
        isLoading={isLoading}
      />
      <CardInfo
        icon={BiSolidMessageRoundedCheck}
        title='پاسخ داده شده'
        value={questionInfo.answeredQuestions}
        isLoading={isLoading}
      />
    </div>
  );
};

QuestionSummarySection.propTypes = {
  className: PropTypes.string,
  questionInfo: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default QuestionSummarySection;
