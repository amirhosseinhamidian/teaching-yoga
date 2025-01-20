/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import SearchFilterSessions from './SearchFilterSessions';
import SessionTable from './SessionTable';
import HeadAction from './HeadAction';

const SessionTableSection = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [filterCourse, setFilterCourse] = useState(-1);
  const [filterTerm, setFilterTerm] = useState(-1);
  const [courseOptions, setCourseOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);

  const fetchSessions = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/sessions?&page=${page}&perPage=10&courseId=${filterCourse}&termId=${filterTerm}${search ? `&search=${search}` : ''}`,
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data.data);
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

  const fetchFilters = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/sessions/filters`,
      );
      if (response.ok) {
        const data = await response.json();
        setCourseOptions(data.courseOptions);
        setTermOptions(data.termOptions);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      toast.showErrorToast('خطای غیرمنتظره');
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
    fetchSessions(page, searchDebounce);
    fetchFilters();
  }, [page, searchDebounce, filterCourse, filterTerm]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const addSessionSuccessfully = (newSession) => {
    setSessions((prev) => {
      // تبدیل ساختار داده‌ی جدید به فرمت داده‌های موجود
      const formattedSession = {
        sessionId: newSession.id,
        sessionName: newSession.name,
        sessionDuration: newSession.duration,
        sessionIsFree: newSession.isFree,
        sessionIsActive: newSession.isActive,
        videoCreatedAt: newSession.createAt,
        termId: newSession.termId,
        termName: newSession.term.name, // فرض بر این است که نام ترم به این شکل ایجاد می‌شود
        courseTitles: '', // اگر نیاز به مقدار خاصی برای عنوان دوره‌ها دارید، اینجا اضافه کنید
      };

      return [formattedSession, ...prev];
    });
  };

  return (
    <div>
      <HeadAction
        addSessionSuccessfully={(newSession) =>
          addSessionSuccessfully(newSession)
        }
      />
      <div className='mt-6 sm:mt-10'>
        <SearchFilterSessions
          className='mb-3 sm:mb-6'
          searchText={searchText}
          setSearchText={setSearchText}
          filterCourse={filterCourse}
          setFilterCourse={setFilterCourse}
          filterTerm={filterTerm}
          setFilterTerm={setFilterTerm}
          courseOptions={courseOptions}
          termOptions={termOptions}
        />
        <SessionTable
          sessions={sessions}
          setSessions={setSessions}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          page={page}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
};

export default SessionTableSection;
