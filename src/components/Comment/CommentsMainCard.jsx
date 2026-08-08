/* eslint-disable no-undef */

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { AnimatePresence, motion } from 'framer-motion';

import CommentCard from './CommentCard';
import CreateCommentCard from './CreateCommentCard';
import EmptyComment from './EmptyComment';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { useAuthUser } from '@/hooks/auth/useAuthUser';

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const getCommentsResponseData = (result) => {
  const comments = Array.isArray(result?.comments)
    ? result.comments
    : Array.isArray(result?.data?.comments)
      ? result.data.comments
      : [];

  const parsedTotalPages = Number(
    result?.totalPages ?? result?.data?.totalPages ?? 1
  );

  return {
    comments,

    totalPages:
      Number.isFinite(parsedTotalPages) && parsedTotalPages > 0
        ? parsedTotalPages
        : 1,
  };
};

const CommentsSkeleton = () => {
  return (
    <div className='space-y-4'>
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <SiteCard
          key={index}
          variant='soft'
          padding='md'
          radius='md'
          className='animate-pulse'
        >
          <div className='flex items-center gap-3'>
            <div className='h-12 w-12 rounded-2xl bg-black/[0.06] dark:bg-white/[0.07]' />

            <div className='flex-1'>
              <div className='h-3 w-28 rounded-full bg-black/[0.06] dark:bg-white/[0.07]' />

              <div className='mt-2 h-2.5 w-20 rounded-full bg-black/[0.05] dark:bg-white/[0.06]' />
            </div>
          </div>

          <div className='mt-5 space-y-2'>
            <div className='h-3 w-full rounded-full bg-black/[0.05] dark:bg-white/[0.06]' />

            <div className='h-3 w-4/5 rounded-full bg-black/[0.05] dark:bg-white/[0.06]' />
          </div>
        </SiteCard>
      ))}
    </div>
  );
};

const CommentsMainCard = ({ className = '', referenceId, isCourse }) => {
  const { user } = useAuthUser();

  const [comments, setComments] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);

  const [pageLoading, setPageLoading] = useState(false);

  const [error, setError] = useState('');

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);

  const [showCreateCard, setShowCreateCard] = useState(false);

  const loadCommentsPage = useCallback(
    async ({ pageNumber, replace = false, signal }) => {
      if (referenceId === null || referenceId === undefined) {
        return false;
      }

      if (replace) {
        setInitialLoading(true);
      } else {
        setPageLoading(true);
      }

      setError('');

      try {
        const apiBaseUrl = getApiBaseUrl();

        const endpoint = isCourse ? '/api/comments' : '/api/comments-article';

        const referenceKey = isCourse ? 'courseId' : 'articleId';

        const url =
          `${apiBaseUrl}${endpoint}` +
          `?${referenceKey}=${encodeURIComponent(referenceId)}` +
          `&page=${encodeURIComponent(pageNumber)}`;

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal,
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error || result?.message || 'دریافت دیدگاه‌ها انجام نشد.'
          );
        }

        const {
          comments: receivedComments,

          totalPages: receivedTotalPages,
        } = getCommentsResponseData(result);

        if (signal?.aborted) {
          return false;
        }

        setComments((currentComments) => {
          if (replace) {
            return receivedComments;
          }

          const existingIds = new Set(
            currentComments.map((comment) => String(comment.id))
          );

          const newComments = receivedComments.filter(
            (comment) => !existingIds.has(String(comment.id))
          );

          return [...currentComments, ...newComments];
        });

        setTotalPages(receivedTotalPages);

        return true;
      } catch (loadError) {
        if (loadError?.name === 'AbortError') {
          return false;
        }

        console.error('[COMMENTS_FETCH_ERROR]', loadError);

        setError(loadError?.message || 'دریافت دیدگاه‌ها انجام نشد.');

        return false;
      } finally {
        if (!signal?.aborted) {
          if (replace) {
            setInitialLoading(false);
          } else {
            setPageLoading(false);
          }
        }
      }
    },
    [isCourse, referenceId]
  );

  useEffect(() => {
    const controller = new AbortController();

    setComments([]);
    setPage(1);
    setTotalPages(1);

    loadCommentsPage({
      pageNumber: 1,
      replace: true,
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadCommentsPage, reloadKey]);

  const toggleCreateCard = () => {
    setShowCreateCard((currentValue) => !currentValue);
  };

  const loadMore = async () => {
    if (pageLoading || page >= totalPages) {
      return;
    }

    const nextPage = page + 1;

    const succeeded = await loadCommentsPage({
      pageNumber: nextPage,
      replace: false,
    });

    if (succeeded) {
      setPage(nextPage);
    }
  };

  const addComment = (newComment) => {
    if (!newComment) {
      return;
    }

    setComments((currentComments) => [
      newComment,

      ...currentComments.filter(
        (comment) => String(comment.id) !== String(newComment.id)
      ),
    ]);
  };

  const hasMore = page < totalPages;

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      dir='rtl'
      className={`px-5 py-7 sm:px-7 sm:py-8 lg:px-8 ${className}`}
    >
      {/* Decorative glows */}
      <div
        aria-hidden='true'
        className='absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[90px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/10 absolute -bottom-28 -left-28 h-64 w-64 rounded-full blur-[95px]'
      />

      <div className='relative z-10'>
        {/* Header */}
        <div className='mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-start gap-4'>
            <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
              <HiOutlineChatBubbleLeftRight size={26} />
            </span>

            <div className='min-w-0'>
              <div className='flex items-center gap-2 text-secondary'>
                <HiOutlineSparkles size={16} />

                <span className='text-[10px] font-bold sm:text-xs'>
                  تجربه و دیدگاه کاربران
                </span>
              </div>

              <h2 className='mt-1 text-xl font-black leading-9 text-text-light sm:text-2xl dark:text-text-dark'>
                نظرات کاربران
              </h2>

              <p className='mt-2 max-w-2xl text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
                تجربه، سؤال یا نظر خودت را با دیگر کاربران به اشتراک بگذار.
              </p>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2 sm:justify-end'>
            {!initialLoading && comments.length > 0 && (
              <SiteBadge
                icon={HiOutlineChatBubbleLeftRight}
                variant='secondary'
                size='lg'
                className='font-faNa'
              >
                {comments.length.toLocaleString('fa-IR')} دیدگاه
              </SiteBadge>
            )}

            <SiteButton
              type='button'
              size='md'
              variant={showCreateCard ? 'secondary' : 'primary'}
              startIcon={HiOutlineChatBubbleLeftRight}
              aria-expanded={showCreateCard}
              onClick={toggleCreateCard}
            >
              {showCreateCard ? 'بستن فرم' : 'ثبت دیدگاه جدید'}
            </SiteButton>
          </div>
        </div>

        {/* Create Comment */}
        <AnimatePresence initial={false}>
          {showCreateCard && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
                y: -10,
              }}
              animate={{
                height: 'auto',
                opacity: 1,
                y: 0,
              }}
              exit={{
                height: 0,
                opacity: 0,
                y: -10,
              }}
              transition={{
                height: {
                  duration: 0.35,

                  ease: [0.4, 0, 0.2, 1],
                },

                opacity: {
                  duration: 0.22,
                },
              }}
              className='overflow-hidden'
            >
              <CreateCommentCard
                user={user}
                isCourse={isCourse}
                referenceId={referenceId}
                onCloseClick={() => setShowCreateCard(false)}
                onCommentAdded={addComment}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments */}
        <div className='mt-6'>
          {initialLoading ? (
            <CommentsSkeleton />
          ) : error && comments.length === 0 ? (
            <SiteCard
              variant='soft'
              padding='lg'
              radius='md'
              role='alert'
              className='border-rose-200 bg-rose-50 text-center dark:border-rose-500/30 dark:bg-rose-500/10'
            >
              <span className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'>
                <HiOutlineChatBubbleLeftRight size={28} />
              </span>

              <h3 className='mt-4 text-base font-black text-rose-700 dark:text-rose-300'>
                دریافت دیدگاه‌ها انجام نشد
              </h3>

              <p className='mx-auto mt-2 max-w-lg text-sm leading-7 text-rose-600 dark:text-rose-300/80'>
                {error}
              </p>

              <SiteButton
                type='button'
                variant='danger'
                size='sm'
                onClick={() => setReloadKey((currentValue) => currentValue + 1)}
                className='mt-5'
              >
                تلاش دوباره
              </SiteButton>
            </SiteCard>
          ) : comments.length === 0 ? (
            <EmptyComment isCourse={isCourse} />
          ) : (
            <div className='space-y-4'>
              <AnimatePresence initial={false}>
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -10,
                    }}
                    transition={{
                      duration: 0.4,

                      delay: Math.min(index * 0.04, 0.2),
                    }}
                  >
                    <CommentCard comment={comment} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {error && (
                <div
                  role='alert'
                  className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-6 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                >
                  {error}
                </div>
              )}

              {hasMore && (
                <div className='flex justify-center border-t border-black/5 pt-6 dark:border-white/10'>
                  <SiteButton
                    type='button'
                    size='lg'
                    variant='secondary'
                    loading={pageLoading}
                    disabled={pageLoading}
                    onClick={loadMore}
                  >
                    {pageLoading
                      ? 'در حال دریافت...'
                      : 'مشاهده دیدگاه‌های بیشتر'}
                  </SiteButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SiteCard>
  );
};

CommentsMainCard.propTypes = {
  className: PropTypes.string,

  referenceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,

  isCourse: PropTypes.bool.isRequired,
};

export default CommentsMainCard;
