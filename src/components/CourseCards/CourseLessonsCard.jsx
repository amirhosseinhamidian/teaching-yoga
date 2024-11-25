import React from 'react';
import PropTypes from 'prop-types';
import Accordion from '../Ui/Accordion/Accordion';
import { formatTime } from '@/utils/dateTimeHelper';
import SessionRow from './SessionRow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const fetchTermsData = async (shortAddress, userId) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/courses/${shortAddress}/terms`,
      {
        cache: 'no-cache',
        method: 'GET',
        headers: {
          userId: userId,
        },
      },
    );
    if (!response.ok) {
      throw new Error('Failed to fetch terms data');
    }
    const terms = await response.json();
    return terms;
  } catch (error) {
    console.error('Error fetching course data:', error);
    return null; // در صورت خطا مقادیر مناسب بازگشت داده می‌شود
  }
};

const CourseLessonsCard = async ({ shortAddress, className }) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId ? session.user.userId : '';
  const data = await fetchTermsData(shortAddress, userId);
  const terms = data.terms;

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
            info2={`زمان: ${formatTime(term.duration, 'hh:mm:ss')}`}
            className='mb-4'
            content={term.sessions.map((session, index) => (
              <SessionRow
                key={session.id}
                session={session}
                number={index + 1}
                courseShortAddress={shortAddress}
              />
            ))}
          />
        ))}
    </div>
  );
};

CourseLessonsCard.propTypes = {
  shortAddress: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default CourseLessonsCard;
