/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CommentCard from './CommentCard';
import OutlineButton from '../Ui/OutlineButton/OutlineButton';
import { FaSpinner, FaAngleDown } from 'react-icons/fa6';
import { useAuth } from '@/contexts/AuthContext';
import CreateCommentCard from './CreateCommentCard';
import EmptyComment from './EmptyComment';

const CommentsMainCard = ({ className, referenceId, isCourse }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [finishComments, setFinishComments] = useState(true);
  const { user } = useAuth();
  const [showCreateCard, setShowCreateCard] = useState(false);

  const createToggleHandler = () => {
    setShowCreateCard((prev) => !prev);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchComments = async () => {
      setLoading(true);
      const url = isCourse
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments?courseId=${referenceId}&page=${page}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments-article?articleId=${referenceId}&page=${page}`;
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setComments((prevComments) => [...prevComments, ...data.comments]);
        setTotalPages(data.totalPages);
        setLoading(false);
        if (page >= data.totalPages) {
          setFinishComments(true);
        } else {
          setFinishComments(false);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error comment fetching =>', error.message);
        }
      }
    };

    fetchComments();

    return () => {
      controller.abort();
    };
  }, [referenceId, page]);

  const loadMoreComments = () => {
    if (page < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const addComment = (newComment) => {
    setComments((prevComments) => [newComment, ...prevComments]);
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <div className='flex items-baseline justify-between'>
        <h3 className='mb-4 font-semibold md:text-lg'>نظرات کاربران</h3>
        <OutlineButton
          className='text-2xs sm:text-sm'
          onClick={createToggleHandler}
        >
          {showCreateCard ? 'بستن' : 'ایجاد نظر جدید'}
        </OutlineButton>
      </div>
      {showCreateCard && (
        <CreateCommentCard
          user={user}
          referenceId={referenceId}
          onCloseClick={createToggleHandler}
          onCommentAdded={addComment}
          isCourse={isCourse}
        />
      )}
      {loading && page === 1 ? (
        <FaSpinner className='mx-auto my-4 animate-spin text-xl text-secondary md:text-3xl' />
      ) : (
        <>
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              className='my-4 sm:m-4'
              comment={comment}
            />
          ))}
          {!finishComments && (
            <OutlineButton
              onClick={loadMoreComments}
              className='mx-auto my-6 flex items-center gap-2 text-sm'
              disable={loading}
            >
              مشاهده بیشتر
              {loading ? (
                <FaSpinner className='animate-spin' />
              ) : (
                <FaAngleDown />
              )}
            </OutlineButton>
          )}
        </>
      )}
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
