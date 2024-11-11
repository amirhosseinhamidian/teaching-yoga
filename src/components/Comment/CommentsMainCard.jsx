'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Ui/Button/Button';
import CommentCard from './CommentCard';
import OutlineButton from '../Ui/OutlineButton/OutlineButton';
import { FaSpinner, FaAngleDown } from 'react-icons/fa6';
import { useAuth } from '@/contexts/AuthContext';
import CreateCommentCard from './CreateCommentCard';

const CommentsMainCard = ({ className, referenceId, isCourse }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [finishComments, setFinishComments] = useState(false);
  const { user } = useAuth();
  const [showCreateCard, setShowCreateCard] = useState(false);

  const createToggleHandler = () => {
    setShowCreateCard((prev) => !prev);
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchComments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/comments?courseId=${referenceId}&page=${page}`,
          {
            signal: controller.signal,
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        );
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setComments((prevComments) => [...prevComments, ...data.comments]);
        setTotalPages(data.totalPages);
        setLoading(false);
        if (page >= data.totalPages) {
          setFinishComments(true);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setError(error.message);
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
    console.log('add new comment => ', newComment);
    setComments((prevComments) => [newComment, ...prevComments]);
  };

  return (
    <div
      className={`rounded-xl bg-surface-light p-6 pb-1 shadow dark:bg-surface-dark ${className}`}
    >
      <div className='flex items-baseline justify-between'>
        <h3 className='mb-4 font-semibold md:text-lg'>نظرات کاربران</h3>
        <Button className='text-xs sm:text-base' onClick={createToggleHandler}>
          {showCreateCard ? 'بستن' : 'ایجاد نظر جدید'}
        </Button>
      </div>
      {showCreateCard && (
        <CreateCommentCard
          user={user}
          courseId={referenceId}
          onCloseClick={createToggleHandler}
          onCommentAdded={addComment}
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
    </div>
  );
};

CommentsMainCard.propTypes = {
  className: PropTypes.string,
  referenceId: PropTypes.number.isRequired,
  isCourse: PropTypes.bool.isRequired,
};

export default CommentsMainCard;
