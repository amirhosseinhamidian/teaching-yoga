/* eslint-disable no-undef */
import React, { useEffect, useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import SearchFilterQuestions from './SearchFilterQuestions';
import QuestionTable from './QuestionTable';

const QuestionTableSection = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [isAnswered, setIsAnswered] = useState('all');

  const fetchQuestion = async (page, search) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/question?&page=${page}&perPage=10&isAnswered=${isAnswered}&search=${search || ''}`,
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data.data);
        setQuestions(data.data.questions);
        setTotalPages(data.data.pagination.totalPages);
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
    fetchQuestion(page, searchDebounce);
  }, [page, searchDebounce, isAnswered]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className='mt-6 sm:mt-10'>
      <SearchFilterQuestions
        className='mb-3 sm:mb-6'
        searchText={searchText}
        setSearchText={setSearchText}
        isAnswered={isAnswered}
        setIsAnswered={setIsAnswered}
      />
      <QuestionTable
        questions={questions}
        setQuestions={setQuestions}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
};

export default QuestionTableSection;
