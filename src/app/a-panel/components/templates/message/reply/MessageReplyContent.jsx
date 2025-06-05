'use client';

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { ImSpinner2 } from 'react-icons/im';
import UserMessage from '@/components/Ui/FloatingMessageButton/UserMessage';
import SupportMessage from '@/components/Ui/FloatingMessageButton/SupportMessage';
import TextEditor from '@/components/Ui/TextEditor/TextEditor';
import Button from '@/components/Ui/Button/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

const MessageReplyContent = ({
  data,
  page,
  sessionId,
  setPage,
  isFetchingMore,
  hasMore,
  setMessages,
}) => {
  const containerRef = useRef();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [replyText, setReplyText] = useState('');
  const [errorReplyText, setErrorReplyText] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const submitReply = async () => {
    // بررسی اگر متن پیام خالی است یا کوتاه
    if (!replyText.trim()) {
      setErrorReplyText('پاسخ نباید خالی باشد.');
      return;
    }
    if (replyText.trim().length < 5) {
      setErrorReplyText('حداقل پاسخ ۵ کارکتر باید باشد.');
      return;
    }
    setErrorReplyText('');

    try {
      setSubmitLoading(true); // نشان دادن لودینگ

      // ساخت payload برای ارسال
      const payload = {
        content: replyText, // استفاده از content به جای Content
      };

      // ارسال درخواست به API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/message/${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to create reply');
      }

      // دریافت اطلاعات پاسخ
      const data = await response.json();

      // افزودن پیام جدید به لیست پیام‌ها
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: data.data.id,
          content: data.data.content,
          sender: 'SUPPORT', // مشخص کردن اینکه پیام از پشتیبان است
          isSeen: true, // پیام جدید است و دیده نشده
        },
      ]);

      toast.showSuccessToast('پاسخ سوال ثبت شد.');
      setReplyText(''); // پاک کردن فیلد پیام پس از ارسال
    } catch (error) {
      console.error('Error to Send Reply Create Request : ', error);
      toast.showErrorToast('خطا در ارسال درخواست، لطفا بعدا تلاش کنید.');
    } finally {
      setSubmitLoading(false); // غیر فعال کردن لودینگ
    }
  };

  // اسکرول به پایین بعد از اولین لود
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (page === 1 && data.messages.length > 0) {
      container.scrollTop = container.scrollHeight;
    }
  }, [data.messages.length, page]);

  // هندل اسکرول برای لود پیام‌های قبلی
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop < 50 && hasMore && !isFetchingMore) {
        setPage((prev) => prev + 1);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isFetchingMore]);

  return (
    <div>
      <div className='mt-8 flex flex-nowrap items-center gap-2'>
        <Image
          src={data.user?.avatar || '/images/default-avatar.png'}
          alt={data.user?.username || 'کاربر'}
          className='h-12 w-12 rounded-full md:h-14 md:w-14 xl:h-20 xl:w-20'
          width={96}
          height={96}
        />
        <div className='flex flex-col text-xs sm:text-sm'>
          <h4>{data.user?.username || 'کاربر مهمان'}</h4>
          <h4 className='font-faNa text-subtext-light dark:text-subtext-dark'>
            {data.user?.phone || 'شماره ثبت نشده'}
          </h4>
        </div>
      </div>

      <div
        ref={containerRef}
        className='mx-auto mt-8 max-h-72 min-h-60 min-w-56 max-w-[600px] space-y-2 overflow-y-auto rounded-xl bg-surface-light p-4 md:max-h-96 md:min-h-80 md:max-w-[700px] dark:bg-surface-dark'
      >
        {isFetchingMore && (
          <div className='flex justify-center py-2'>
            <ImSpinner2 size={18} className='animate-spin text-gray-400' />
          </div>
        )}

        {data.messages.map((msg) =>
          msg.sender === 'USER' ? (
            <UserMessage key={msg.id} content={msg.content} className='mb-2' />
          ) : (
            <SupportMessage
              key={msg.id}
              content={msg.content}
              className='mb-2'
            />
          ),
        )}
      </div>
      <div className='my-8 flex flex-col items-end gap-4 py-3 sm:flex-row sm:px-6'>
        <TextEditor
          value={replyText}
          onChange={setReplyText}
          maxLength={2000}
          label='متن پاسخ'
          placeholder='متن پاسخ را بنویسید'
          fullWidth
          errorMessage={errorReplyText}
          toolbarItems={[
            ['bold', 'italic', 'underline', 'strike'],
            [{ align: [] }, { direction: 'rtl' }], // تنظیم جهت متن
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ color: [] }, { background: [] }],
            ['link'],
            ['clean'], // پاک کردن فرمت
          ]}
        />
        <Button
          shadow
          className='whitespace-nowrap text-xs sm:text-sm md:text-base'
          isLoading={submitLoading}
          onClick={submitReply}
        >
          ثبت پاسخ
        </Button>
      </div>
    </div>
  );
};

MessageReplyContent.propTypes = {
  data: PropTypes.object.isRequired,
  page: PropTypes.number.isRequired,
  sessionId: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired,
  setMessages: PropTypes.func.isRequired,
  isFetchingMore: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
};

export default MessageReplyContent;
