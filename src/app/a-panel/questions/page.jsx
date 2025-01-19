/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import QuestionSummarySection from '../components/templates/questions/QuestionSummarySection';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import QuestionTableSection from '../components/templates/questions/QuestionTableSection';

const QuestionPage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [questionInfo, setQuestionInfo] = useState({});

  const fetchTicketsInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/question/info`,
      );
      if (response.ok) {
        const data = await response.json();
        setQuestionInfo(data.data);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast(' خطای غیرمنتظره در باکس اطلاعات');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  useEffect(() => {
    fetchTicketsInfo();
  }, []);
  return (
    <div>
      <QuestionSummarySection
        isLoading={isLoadingInfo}
        questionInfo={questionInfo}
      />
      <QuestionTableSection />
    </div>
  );
};

export default QuestionPage;
