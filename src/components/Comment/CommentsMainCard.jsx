/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CommentCard from './CommentCard';
import OutlineButton from '../Ui/OutlineButton/OutlineButton';
import { FaSpinner, FaAngleDown } from 'react-icons/fa6';
import CreateCommentCard from './CreateCommentCard';
import EmptyComment from './EmptyComment';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const CommentsMainCard = ({ className, referenceId, isCourse }) => {
  const { user } = useAuthUser();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true); // فقط لود اولیه
  const [pageLoading, setPageLoading] = useState(false); // لود صفحات بعدی
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateCard, setShowCreateCard] = useState(false);

  // Toggle create card
  const toggleCreateCard = () => setShowCreateCard((prev) => !prev);

  // ⬇️ URL مناسب با نوع کامنت (course/article)
  const commentsUrl = isCourse
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments?courseId=${referenceId}&page=${page}`
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments-article?articleId=${referenceId}&page=${page}`;

  // ======================
  // 🟦 Fetch Comments
  // ======================
  useEffect(() => {
    const controller = new AbortController();

    const getComments = async () => {
      if (page === 1) setLoading(true);
      else setPageLoading(true);

      try {
        const res = await fetch(commentsUrl, {
          signal: controller.signal,
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Failed to load comments');

        const data = await res.json();

        setComments((prev) =>
          page === 1 ? data.comments : [...prev, ...data.comments]
        );

        setTotalPages(data.totalPages || 1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error loading comments:', err);
        }
      } finally {
        setLoading(false);
        setPageLoading(false);
      }
    };

    getComments();

    return () => controller.abort();
  }, [page, referenceId]);

  // ======================
  // 🟦 Load More
  // ======================
  const loadMore = () => {
    if (page < totalPages && !pageLoading) {
      setPage((prev) => prev + 1);
    }
  };

  // ======================
  // 🟦 Add New Comment (Optimistic)
  // ======================
  const addComment = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <div className='flex items-baseline justify-between'>
        <h3 className='mb-4 font-semibold md:text-lg'>نظرات کاربران</h3>

        <OutlineButton
          className='text-2xs sm:text-sm'
          onClick={toggleCreateCard}
        >
          {showCreateCard ? 'بستن' : 'ایجاد نظر جدید'}
        </OutlineButton>
      </div>

      {/* Create Comment Box */}
      {showCreateCard && (
        <CreateCommentCard
          user={user}
          isCourse={isCourse}
          referenceId={referenceId}
          onCloseClick={toggleCreateCard}
          onCommentAdded={addComment}
        />
      )}

      {/* Initial Loading */}
      {loading && page === 1 ? (
        <FaSpinner className='mx-auto my-4 animate-spin text-xl text-secondary md:text-3xl' />
      ) : (
        <>
          {/* Render Comments */}
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              className='my-4 sm:m-4'
              comment={comment}
            />
          ))}

          {/* Load more */}
          {page < totalPages && (
            <OutlineButton
              onClick={loadMore}
              className='mx-auto my-6 flex items-center gap-2 text-sm'
              disable={pageLoading}
            >
              مشاهده بیشتر
              {pageLoading ? (
                <FaSpinner className='animate-spin' />
              ) : (
                <FaAngleDown />
              )}
            </OutlineButton>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && comments.length === 0 && (
        <EmptyComment isCourse={isCourse} />
      )}
    </div>
  );
};

CommentsMainCard.propTypes = {
  className: PropTypes.string,
  referenceId: PropTypes.number.isRequired,
  isCourse: PropTypes.bool.isRequired,
};

export default CommentsMainCard;
