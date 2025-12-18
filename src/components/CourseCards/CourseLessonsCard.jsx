/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Accordion from '../Ui/Accordion/Accordion';
import { formatTime } from '@/utils/dateTimeHelper';
import SessionRow from './SessionRow';

// Redux User
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const fetchTermsData = async (shortAddress) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}/terms`,
      {
        cache: 'no-cache',
        method: 'GET',
      }
    );

    if (!response.ok) throw new Error('Failed to fetch terms data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching course data:', error);
    return null;
  }
};

export default function CourseLessonsCard({
  shortAddress,
  activeSessionId,
  className,
}) {
  // 🟢 user از Redux (Client-Side)
  const { isAuthenticated } = useAuthUser();

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseMeta, setCourseMeta] = useState({
    hasSubscriptionPlan: false,
    isSubscriptionOnly: false,
  });

  // 🟢 فقط اگر کاربر لاگین باشد، دیتای جلسات را بگیر
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    (async () => {
      const data = await fetchTermsData(shortAddress);
      setTerms(data?.courseTerms || []);
      setCourseMeta({
        hasSubscriptionPlan: data?.hasSubscriptionPlan || false,
        isSubscriptionOnly: data?.isSubscriptionOnly || false,
      });
      setLoading(false);
    })();
  }, [shortAddress, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div
        className={`rounded-xl bg-surface-light p-6 shadow dark:bg-surface-dark ${className}`}
      >
        <h3 className='mb-4 font-semibold md:text-lg'>سرفصل‌ها</h3>
        <p className='text-red-500 dark:text-red-300 text-sm'>
          برای مشاهده جلسات، لطفاً ابتدا وارد حساب خود شوید.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`rounded-xl bg-surface-light p-6 shadow dark:bg-surface-dark ${className}`}
      >
        <h3 className='mb-4 font-semibold md:text-lg'>سرفصل‌ها</h3>
        <p className='text-sm'>در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <h3 className='mb-4 font-semibold md:text-lg'>سرفصل‌ها</h3>

      {terms.length === 0 && (
        <p className='text-sm text-subtext-light dark:text-subtext-dark'>
          فعلاً سرفصلی برای این دوره ثبت نشده است.
        </p>
      )}

      {terms.map((term) => {
        const t = term.term;
        const sessions = Array.isArray(t.sessions) ? t.sessions : [];

        return (
          <Accordion
            key={t.id}
            title={t.name}
            subtitle={t.subtitle}
            info1={`جلسات: ${sessions.length}`}
            info2={`زمان: ${formatTime(t.duration || 0, 'hh:mm:ss')}`}
            className='mb-4 font-faNa'
            isOpenDefault={sessions.some((s) => s.id === activeSessionId)}
            content={sessions.map((session, index) => (
              <SessionRow
                key={session.id}
                session={session}
                number={index + 1}
                activeSessionId={activeSessionId}
                courseShortAddress={shortAddress}
                hasSubscriptionAccess={courseMeta.hasSubscriptionPlan}
                isSubscriptionOnly={courseMeta.isSubscriptionOnly}
              />
            ))}
          />
        );
      })}
    </div>
  );
}

CourseLessonsCard.propTypes = {
  shortAddress: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeSessionId: PropTypes.string,
};
