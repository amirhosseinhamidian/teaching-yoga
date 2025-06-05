'use client';

import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import MessageReplyContent from '../../components/templates/message/reply/MessageReplyContent';

const ReplyMessage = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = async (sessionId, page) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/message/${sessionId}?page=${page}&perPage=10`,
        {
          cache: 'no-cache',
          method: 'GET',
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching messages: ', error);
      return null;
    }
  };

  const checkSeenMessages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/message/seen?sessionId=${sessionId}`,
        {
          method: 'PATCH', // استفاده از متد PATCH برای به‌روزرسانی
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        throw new Error('Failed to update message status');
      }

      const data = await response.json();

      if (data.success) {
        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.map((message) => ({
            ...message,
            isSeen: true,
          }));

          return updatedMessages;
        });
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching messages: ', error);
    }
  };

  const loadInitialMessages = async () => {
    setIsLoading(true);
    const data = await fetchMessages(sessionId, 1);
    if (data) {
      setMessages(data.messages);
      setUserInfo(data.user);
      setHasMore(page < data.pagination.totalPages);
      await checkSeenMessages();
    }
    setIsLoading(false);
  };

  const loadMoreMessages = async (nextPage) => {
    setIsFetchingMore(true);
    const data = await fetchMessages(sessionId, nextPage);
    if (data) {
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(page < data.pagination.totalPages);
    }
    setIsFetchingMore(false);
  };

  useEffect(() => {
    if (sessionId) {
      loadInitialMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    if (page === 1 || isLoading) return;
    loadMoreMessages(page);
  }, [page]);

  if (isLoading) {
    return <div className='py-6 text-center'>در حال بارگذاری...</div>;
  }

  return (
    <div>
      <h1 className='my-2 text-lg font-semibold md:my-3 md:text-2xl'>
        جزییات و پاسخ به پیام کاربر
      </h1>
      <MessageReplyContent
        data={{ user: userInfo, messages }}
        page={page}
        setPage={setPage}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        sessionId={sessionId}
        setMessages={setMessages}
      />
    </div>
  );
};

export default ReplyMessage;
