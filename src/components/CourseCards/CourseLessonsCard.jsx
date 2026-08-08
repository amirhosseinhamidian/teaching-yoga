/* eslint-disable no-undef */

'use client';

import React, { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import { usePathname, useRouter } from 'next/navigation';

import { AnimatePresence, motion } from 'framer-motion';

import SessionRow from './SessionRow';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import { formatTime } from '@/utils/dateTimeHelper';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlinePlayCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const fetchTermsData = async (shortAddress, signal) => {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

  const response = await fetch(
    `${apiBaseUrl}/api/courses/${encodeURIComponent(shortAddress)}/terms`,
    {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
      signal,
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || `Terms API returned ${response.status}`);
  }

  return result;
};

const CourseLessonsCard = ({
  shortAddress,
  activeSessionId,
  className = '',
}) => {
  const { isAuthenticated } = useAuthUser();

  const pathname = usePathname();
  const router = useRouter();

  const [terms, setTerms] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [retryKey, setRetryKey] = useState(0);

  const [openTermId, setOpenTermId] = useState(null);

  const [courseMeta, setCourseMeta] = useState({
    hasSubscriptionPlan: false,
    isSubscriptionOnly: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setTerms([]);
      setLoading(false);
      setError('');
      setOpenTermId(null);

      return undefined;
    }

    const controller = new AbortController();

    const loadTerms = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await fetchTermsData(shortAddress, controller.signal);

        const safeCourseTerms = Array.isArray(data?.courseTerms)
          ? data.courseTerms
          : [];

        const normalizedTerms = safeCourseTerms
          .map((courseTerm) => courseTerm?.term)
          .filter(Boolean);

        setTerms(normalizedTerms);

        setCourseMeta({
          hasSubscriptionPlan: Boolean(data?.hasSubscriptionPlan),

          isSubscriptionOnly: Boolean(data?.isSubscriptionOnly),
        });

        const activeTerm = normalizedTerms.find(
          (term) =>
            Array.isArray(term?.sessions) &&
            term.sessions.some(
              (session) => String(session.id) === String(activeSessionId)
            )
        );

        setOpenTermId(activeTerm?.id ?? normalizedTerms[0]?.id ?? null);
      } catch (loadError) {
        if (loadError?.name === 'AbortError') {
          return;
        }

        console.error('[COURSE_TERMS_FETCH_ERROR]', loadError);

        setTerms([]);

        setError('دریافت ترم های دوره انجام نشد. دوباره تلاش کنید.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadTerms();

    return () => {
      controller.abort();
    };
  }, [shortAddress, activeSessionId, isAuthenticated, retryKey]);

  const totalSessions = useMemo(
    () =>
      terms.reduce((total, term) => {
        const sessions = Array.isArray(term?.sessions) ? term.sessions : [];

        return total + sessions.length;
      }, 0),
    [terms]
  );

  const handleLogin = () => {
    sessionStorage.setItem('previousPage', pathname);

    router.push('/login');
  };

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className={`px-5 py-7 sm:px-7 sm:py-8 lg:px-8 ${className}`}
    >
      {/* Decorative glow */}
      <div
        aria-hidden='true'
        className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-start gap-4'>
            <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineAcademicCap size={26} />
            </span>

            <div className='min-w-0'>
              <div className='flex items-center gap-2 text-secondary'>
                <HiOutlineSparkles size={16} />

                <span className='text-[10px] font-bold sm:text-xs'>
                  مسیر آموزشی دوره
                </span>
              </div>

              <h2 className='mt-1 text-xl font-black leading-9 text-text-light sm:text-2xl dark:text-text-dark'>
                ترم ها و جلسات
              </h2>

              <p className='mt-2 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                جلسات دوره به‌صورت مرحله‌به‌مرحله در ترم ها آموزشی تنظیم
                شده‌اند.
              </p>
            </div>
          </div>

          {/* Stats */}
          {isAuthenticated && !loading && terms.length > 0 && (
            <div className='flex shrink-0 flex-wrap items-center gap-2'>
              <span className='inline-flex min-h-9 items-center gap-2 rounded-2xl border border-secondary/15 bg-secondary/5 px-3 font-faNa text-[10px] font-bold text-secondary dark:bg-secondary/10'>
                <HiOutlineBookOpen size={16} />

                <span>{terms.length.toLocaleString('fa-IR')}</span>

                <span>ترم</span>
              </span>

              <span className='inline-flex min-h-9 items-center gap-2 rounded-2xl border border-secondary/15 bg-secondary/5 px-3 font-faNa text-[10px] font-bold text-secondary dark:bg-secondary/10'>
                <HiOutlinePlayCircle size={16} />

                <span>{totalSessions.toLocaleString('fa-IR')}</span>

                <span>جلسه</span>
              </span>
            </div>
          )}
        </div>

        {/* Not authenticated */}
        {!isAuthenticated ? (
          <div className='border-yellow/20 bg-yellow/5 dark:bg-yellow/10 relative overflow-hidden rounded-[26px] border px-5 py-8 text-center'>
            <div
              aria-hidden='true'
              className='bg-yellow/10 absolute -right-20 -top-20 h-52 w-52 rounded-full blur-[70px]'
            />

            <span className='bg-yellow/10 text-yellow relative mx-auto flex h-14 w-14 items-center justify-center rounded-[20px]'>
              <HiOutlineBookOpen size={28} />
            </span>

            <h3 className='relative mt-4 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
              برای مشاهده جلسات وارد حساب خود شوید
            </h3>

            <p className='relative mx-auto mt-2 max-w-lg text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
              پس از ورود می‌توانی ترم های دوره، وضعیت دسترسی و جلسات منتشرشده را
              مشاهده کنی.
            </p>

            <SiteButton
              type='button'
              variant='primary'
              size='lg'
              onClick={handleLogin}
              className='relative mt-5'
            >
              ورود یا ثبت‌نام
            </SiteButton>
          </div>
        ) : loading ? (
          /* Loading skeleton */
          <div className='space-y-3'>
            {Array.from({
              length: 3,
            }).map((_, index) => (
              <div
                key={index}
                className='h-[88px] animate-pulse rounded-[22px] border border-black/5 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.04]'
              />
            ))}
          </div>
        ) : error ? (
          /* Error */
          <div
            role='alert'
            className='rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-7 text-center dark:border-rose-500/30 dark:bg-rose-500/10'
          >
            <p className='text-sm leading-8 text-rose-600 dark:text-rose-300'>
              {error}
            </p>

            <SiteButton
              type='button'
              variant='danger'
              size='sm'
              onClick={() => setRetryKey((current) => current + 1)}
              className='mt-4'
            >
              تلاش دوباره
            </SiteButton>
          </div>
        ) : terms.length === 0 ? (
          /* Empty */
          <div className='rounded-[24px] border border-black/5 bg-background-light/45 px-5 py-8 text-center dark:border-white/10 dark:bg-background-dark/35'>
            <span className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineAcademicCap size={28} />
            </span>

            <h3 className='mt-4 text-base font-black text-text-light dark:text-text-dark'>
              هنوز ترمی ثبت نشده است
            </h3>

            <p className='mt-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
              ترم ها و جلسات جدید پس از انتشار در همین بخش نمایش داده خواهند شد.
            </p>
          </div>
        ) : (
          /* Terms */
          <div className='space-y-4'>
            {terms.map((term, termIndex) => {
              const sessions = Array.isArray(term?.sessions)
                ? term.sessions
                : [];

              const isOpen = String(openTermId) === String(term.id);

              const containsActiveSession = sessions.some(
                (session) => String(session.id) === String(activeSessionId)
              );

              const contentId = `course-term-content-${term.id}`;

              const buttonId = `course-term-button-${term.id}`;

              return (
                <SiteCard
                  key={term.id}
                  as='article'
                  variant={isOpen ? 'secondary' : 'soft'}
                  padding='none'
                  radius='md'
                  className={`transition-all duration-300 ${
                    isOpen
                      ? 'shadow-[0_18px_50px_rgba(38,145,125,0.08)]'
                      : 'hover:border-secondary/20'
                  }`}
                >
                  {/* Term header */}
                  <button
                    id={buttonId}
                    type='button'
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() =>
                      setOpenTermId((currentId) =>
                        String(currentId) === String(term.id) ? null : term.id
                      )
                    }
                    className='flex w-full items-center justify-between gap-4 px-4 py-5 text-right sm:px-5'
                  >
                    <span className='flex min-w-0 items-center gap-3 sm:gap-4'>
                      {/* Term number */}
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-faNa text-xs font-black transition-all duration-300 ${
                          isOpen
                            ? 'bg-secondary text-white shadow-[0_10px_25px_rgba(38,145,125,0.22)]'
                            : 'bg-secondary/10 text-secondary'
                        }`}
                      >
                        {(termIndex + 1).toLocaleString('fa-IR', {
                          minimumIntegerDigits: 2,
                          useGrouping: false,
                        })}
                      </span>

                      {/* Term info */}
                      <span className='min-w-0'>
                        <span
                          className={`block text-sm font-black leading-7 transition-colors duration-300 sm:text-base ${
                            isOpen
                              ? 'text-secondary'
                              : 'text-text-light dark:text-text-dark'
                          }`}
                        >
                          {term.name}
                        </span>

                        {term.subtitle && (
                          <span className='mt-1 line-clamp-1 block text-[10px] leading-5 text-subtext-light sm:text-xs dark:text-subtext-dark'>
                            {term.subtitle}
                          </span>
                        )}

                        <span className='mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                          <span className='flex items-center gap-1.5'>
                            <HiOutlinePlayCircle
                              size={15}
                              className='text-secondary'
                            />

                            <span className='font-faNa'>
                              {sessions.length.toLocaleString('fa-IR')}
                            </span>

                            <span>جلسه</span>
                          </span>

                          <span className='flex items-center gap-1.5'>
                            <HiOutlineClock
                              size={15}
                              className='text-secondary'
                            />

                            <span className='font-faNa'>
                              {formatTime(term.duration || 0, 'hh:mm:ss')}
                            </span>
                          </span>

                          {containsActiveSession && (
                            <span className='flex items-center gap-1.5 font-bold text-secondary'>
                              <HiOutlineCheckBadge size={15} />

                              <span>جلسه فعال</span>
                            </span>
                          )}
                        </span>
                      </span>
                    </span>

                    {/* Arrow */}
                    <span
                      aria-hidden='true'
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                        isOpen
                          ? 'rotate-180 border-secondary bg-secondary text-white'
                          : 'border-black/10 bg-surface-light text-text-light dark:border-white/10 dark:bg-surface-dark dark:text-text-dark'
                      }`}
                    >
                      <span className='block h-2.5 w-2.5 rotate-[-45deg] border-b-2 border-l-2 border-current' />
                    </span>
                  </button>

                  {/* Term content */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={contentId}
                        role='region'
                        aria-labelledby={buttonId}
                        initial={{
                          height: 0,
                          opacity: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                        }}
                        transition={{
                          height: {
                            duration: 0.35,

                            ease: [0.4, 0, 0.2, 1],
                          },

                          opacity: {
                            duration: 0.23,
                          },
                        }}
                        className='overflow-hidden'
                      >
                        <div className='border-t border-black/5 px-3 py-3 sm:px-4 sm:py-4 dark:border-white/10'>
                          {sessions.length > 0 ? (
                            <div className='space-y-2'>
                              {sessions.map((session, index) => (
                                <SessionRow
                                  key={session.id}
                                  session={session}
                                  number={index + 1}
                                  activeSessionId={activeSessionId}
                                  courseShortAddress={shortAddress}
                                  hasSubscriptionAccess={
                                    courseMeta.hasSubscriptionPlan
                                  }
                                  isSubscriptionOnly={
                                    courseMeta.isSubscriptionOnly
                                  }
                                />
                              ))}
                            </div>
                          ) : (
                            <div className='rounded-2xl bg-black/[0.025] px-4 py-5 text-center text-xs leading-7 text-subtext-light dark:bg-white/[0.03] dark:text-subtext-dark'>
                              هنوز جلسه‌ای برای این ترم منتشر نشده است.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SiteCard>
              );
            })}
          </div>
        )}
      </div>
    </SiteCard>
  );
};

CourseLessonsCard.propTypes = {
  shortAddress: PropTypes.string.isRequired,

  className: PropTypes.string,

  activeSessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default CourseLessonsCard;
