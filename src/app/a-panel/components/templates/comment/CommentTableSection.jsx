/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import CommentTable from './CommentTable';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import SearchFilterComment from './SearchFilterComment';

const CommentTableSection = ({ type }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchComments = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/comment?type=${type}&page=${page}&perPage=10&status=${filterStatus}&search=${search || ''}`,
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  // اجرای جستجو با debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchDebounce(searchText); // به‌روزرسانی وضعیت جستجو پس از توقف تایپ
      setPage(1); // بازگشت به صفحه اول در صورت تغییر متن جستجو
    }, 2000);

    return () => clearTimeout(delayDebounceFn); // پاک‌سازی تایمر قبلی
  }, [searchText]);

  // فراخوانی API هنگام تغییر صفحه یا جستجو
  useEffect(() => {
    fetchComments(page, searchDebounce);
  }, [page, searchDebounce, filterStatus]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className='mt-6 sm:mt-10'>
      <SearchFilterComment
        className='mb-3 sm:mb-6'
        searchText={searchText}
        setSearchText={setSearchText}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
      <CommentTable
        comments={comments}
        setComments={setComments}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        page={page}
        totalPages={totalPages}
        type={type}
      />
    </div>
  );
};

CommentTableSection.propTypes = {
  type: PropTypes.oneOf(['course', 'article']).isRequired, // مقدار باید یا 'course' یا 'article' باشد
};

export default CommentTableSection;
