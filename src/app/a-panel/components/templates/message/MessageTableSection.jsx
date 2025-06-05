'use client';
/* eslint-disable no-undef */
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import React, { useEffect, useState } from 'react';
import SearchFilterMessages from './SearchFilterMessages';
import MessageTable from './MessageTable';

const MessageTableSection = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [isSeen, setIsSeen] = useState('all');

  const fetchMessages = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/message?&page=${page}&perPage=10&isSeen=${isSeen}&search=${search || ''}`,
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.sessions);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.showErrorToast('خطایی رخ داده است');
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
    fetchMessages(page, searchDebounce);
  }, [page, searchDebounce, isSeen]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  return (
    <div className='mt-6 sm:mt-10'>
      <SearchFilterMessages
        className='mb-3 sm:mb-6'
        searchText={searchText}
        setSearchText={setSearchText}
        isSeen={isSeen}
        setIsSeen={setIsSeen}
      />
      <MessageTable
        sessions={messages}
        setSessions={setMessages}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
};

export default MessageTableSection;
