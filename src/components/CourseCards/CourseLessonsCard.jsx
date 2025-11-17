/* eslint-disable no-undef */
import React from 'react'
import PropTypes from 'prop-types'
import Accordion from '../Ui/Accordion/Accordion'
import { formatTime } from '@/utils/dateTimeHelper'
import SessionRow from './SessionRow'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const fetchTermsData = async (shortAddress, userId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}/terms`,
      {
        cache: 'no-cache',
        method: 'GET',
        headers: {
          userId: userId,
        },
      }
    )
    if (!response.ok) {
      throw new Error('Failed to fetch terms data')
    }
    const terms = await response.json()
    return terms
  } catch (error) {
    console.error('Error fetching course data:', error)
    return null
  }
}

const CourseLessonsCard = async ({
  shortAddress,
  activeSessionId,
  className,
}) => {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.userId ? session.user.userId : ''

  const data = await fetchTermsData(shortAddress, userId)
  const terms = data?.courseTerms || []

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
        const t = term.term

        // اطمینان از اینکه sessions همیشه آرایه است
        const sessions = Array.isArray(t.sessions) ? t.sessions : []

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
              />
            ))}
          />
        )
      })}
    </div>
  )
}

CourseLessonsCard.propTypes = {
  shortAddress: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeSessionId: PropTypes.string,
}

export default CourseLessonsCard
