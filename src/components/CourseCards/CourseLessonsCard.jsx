'use client';
import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '../Ui/Accordion/Accordion';
import { formatTime } from '@/utils/dateTimeHelper';
import SessionRow from './SessionRow';

const CourseLessonsCard = ({ terms, className }) => {
  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <h3 className='mb-4 font-semibold md:text-lg'>سرفصل‌ها</h3>
      {terms &&
        terms.map((term) => (
          <Accordion
            key={term.id}
            title={term.name}
            subtitle={term.subtitle}
            info1={`جلسات: ${term.sessions.length}`}
            info2={`زمان: ${formatTime(term.duration)}`}
            className='mb-4'
            content={term.sessions.map((session, index) => (
              <SessionRow
                key={session.id}
                session={session}
                number={index + 1}
              />
            ))}
          />
        ))}
    </div>
  );
};

CourseLessonsCard.propTypes = {
  terms: PropTypes.array.isRequired,
  className: PropTypes.string,
};

export default CourseLessonsCard;
