/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { MdMessage, MdSend } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { ImSpinner2 } from 'react-icons/im';
import IconButton from '../ButtonIcon/ButtonIcon';
import Input from '../Input/Input';
import UserMessage from './UserMessage';
import SupportMessage from './SupportMessage';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useSession } from 'next-auth/react';
import { getAnonymousId } from '@/utils/localStorageHelper';

export default function FloatingMessageButton() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const containerRef = useRef();

  const toggleMessage = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const fetchMessages = async (requestedPage = 1, appendToTop = false) => {
    try {
      if (requestedPage === 1) {
        setIsLoadingInitial(true);
      } else {
        setIsFetchingMore(true);
      }

      const anonymousId = getAnonymousId();

      const queryParams = new URLSearchParams();
      if (anonymousId) queryParams.append('anonymousId', anonymousId);
      queryParams.append('page', requestedPage.toString());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/support-message?${queryParams.toString()}`,
      );

      if (res.ok) {
        const data = await res.json();

        if (requestedPage === 1) {
          setMessages(data.messages);
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop =
                containerRef.current.scrollHeight;
            }
          }, 100);
        } else if (appendToTop) {
          setMessages((prev) => [...data.messages, ...prev]);
        }

        setPage(requestedPage);
        setHasMore(requestedPage < data.totalPages);
      } else {
        toast.showErrorToast('خطا در دریافت پیام‌ها');
      }
    } catch (error) {
      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setIsLoadingInitial(false);
      setIsFetchingMore(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);

    try {
      const payload = { content: message.trim() };
      if (!session?.user?.userId) {
        payload.anonymousId = getAnonymousId();
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/support-message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMessage('');
        setTimeout(() => {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }, 100);
      } else {
        toast.showErrorToast('خطا در ارسال پیام');
      }
    } catch (err) {
      toast.showErrorToast('خطای شبکه');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      setHasMore(true);
      fetchMessages(1);
    }

    const handleEsc = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 20 && hasMore && !isFetchingMore) {
        fetchMessages(page + 1, true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [open, page, hasMore, isFetchingMore]);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => toggleMessage()}
        className='fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-text-light shadow-lg transition-transform duration-300 hover:scale-110 sm:h-14 sm:w-14'
      >
        {open ? <IoClose size={28} /> : <MdMessage size={28} />}
      </button>

      {/* Chat Box */}
      {open && (
        <div className='fixed bottom-[82px] left-6 z-50 flex max-h-[70vh] max-w-[320px] flex-col overflow-hidden rounded-xl bg-white shadow-xl md:bottom-[88px] dark:bg-surface-dark'>
          {/* Header */}
          <div className='flex items-center justify-between border-b p-3 dark:border-gray-700'>
            <span className='text-sm font-semibold'>پشتیبانی</span>
          </div>

          {/* Messages */}
          <div
            ref={containerRef}
            className='max-h-72 min-h-60 flex-1 space-y-2 overflow-y-auto bg-surface-light p-3 text-sm md:max-h-96 md:min-h-80 dark:bg-surface-dark'
          >
            {isLoadingInitial ? (
              <div className='flex h-full items-center justify-center'>
                <ImSpinner2 size={24} className='animate-spin text-gray-400' />
              </div>
            ) : messages.length > 0 ? (
              <>
                {isFetchingMore && (
                  <div className='flex justify-center py-2'>
                    <ImSpinner2
                      size={18}
                      className='animate-spin text-gray-400'
                    />
                  </div>
                )}
                {messages.map((msg) =>
                  msg.sender === 'USER' ? (
                    <UserMessage key={msg.id} content={msg.content} />
                  ) : (
                    <SupportMessage key={msg.id} content={msg.content} />
                  ),
                )}
              </>
            ) : (
              <p className='text-center text-2xs text-subtext-light xs:text-xs md:text-sm dark:text-subtext-dark'>
                هنوز گفت‌وگویی آغاز نشده! <br />
                می‌تونی سوالاتی مثل این‌ها بپرسی:
                <ul className='mt-2 list-inside list-disc text-right'>
                  <li>دوره مناسب سطح من چیه؟</li>
                  <li>آیا تمرینات برای بارداری مناسبه؟</li>
                  <li>چطور به ویدیوهای خریداری‌شده دسترسی پیدا کنم؟</li>
                  <li>مشکل در پرداخت دارم</li>
                </ul>
              </p>
            )}
          </div>

          {/* Input */}
          <div className='flex gap-2 border-t p-3 dark:border-gray-700'>
            <Input
              type='text'
              value={message}
              onChange={setMessage}
              fullWidth
              onEnterPress={handleSend}
              placeholder='پیام خود را بنویسید...'
              className='flex-1 px-3 py-2 text-sm'
            />
            <IconButton
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              loading={isSending}
              className='hover:bg-primary-dark rotate-180 rounded-md px-3 py-2 disabled:opacity-50'
              icon={MdSend}
            />
          </div>
        </div>
      )}
    </>
  );
}
