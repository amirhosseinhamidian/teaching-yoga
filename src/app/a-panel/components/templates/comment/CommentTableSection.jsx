// CommentTableSection.jsx

/* eslint-disable no-undef */
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import CommentTable from './CommentTable';
import SearchFilterComment from './SearchFilterComment';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const CommentTableSection = ({ type }) => {
  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchComments = useCallback(
    async (currentPage, search, signal) => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          type,
          page: String(currentPage),
          perPage: '10',
          status: filterStatus,
          search: search || '',
        });

        const response = await fetch(
          `/api/admin/comment?${params.toString()}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || 'خطایی در دریافت نظرات رخ داد');
        }

        setComments(Array.isArray(data?.comments) ? data.comments : []);

        setTotalPages(Math.max(Number(data?.pagination?.totalPages || 1), 1));
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[FETCH_ADMIN_COMMENTS_ERROR]', error);
          toast.showErrorToast(error?.message || 'خطای غیرمنتظره‌ای رخ داد');
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [filterStatus, toast, type]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchDebounce(searchText.trim());
      setPage(1);
    }, 700);

    return () => clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus, type]);

  useEffect(() => {
    const controller = new AbortController();

    fetchComments(page, searchDebounce, controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchComments, page, searchDebounce]);

  return (
    <div className='mt-6 sm:mt-10'>
      <SearchFilterComment
        className='mb-3 sm:mb-6'
        searchText={searchText}
        setSearchText={setSearchText}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {type === 'course' && (
        <div className='mb-4 rounded-2xl border border-secondary/15 bg-secondary/5 px-4 py-3 text-xs leading-6 text-subtext-light dark:text-subtext-dark'>
          فقط نظرات تأییدشده دوره‌ها قابلیت انتخاب برای نمایش در صفحه اصلی را
          دارند. ترتیب کمتر، اولویت نمایش بالاتری دارد.
        </div>
      )}

      <CommentTable
        comments={comments}
        setComments={setComments}
        isLoading={isLoading}
        onPageChange={setPage}
        page={page}
        totalPages={totalPages}
        type={type}
      />
    </div>
  );
};

CommentTableSection.propTypes = {
  type: PropTypes.oneOf(['course', 'article']).isRequired,
};

export default CommentTableSection;
