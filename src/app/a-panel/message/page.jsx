/* eslint-disable no-undef */
'use client';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import React, { useEffect, useState } from 'react';
import MessageSummarySection from '../components/templates/message/MessageSummarySection';
import MessageTableSection from '../components/templates/message/MessageTableSection';

const MessagePage = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [messageInfo, setMessageInfo] = useState({});
  const fetchMessagesInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/message/info`,
      );
      if (response.ok) {
        const data = await response.json();
        setMessageInfo(data);
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
    fetchMessagesInfo();
  }, []);
  return (
    <div>
      <MessageSummarySection
        isLoading={isLoadingInfo}
        messageInfo={messageInfo}
      />
      <MessageTableSection />
    </div>
  );
};

export default MessagePage;
