'use client';
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TicketReplyContent from '../../components/templates/tickets/reply/TicketReplyContent';

const fetchTicket = async (ticketId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket/${ticketId}`,
      {
        cache: 'no-cache',
        method: 'GET',
      },
    );

    if (!response.ok) {
      throw new Error('Failed to Fetch Ticket Data!');
    }
    return await response.json();
  } catch (error) {
    console.error('Error Fetch ticket: ', error);
  }
};

function TicketReplyPage() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticketId');

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getTicket = async () => {
      const data = await fetchTicket(ticketId);
      setTicket(data);
      setIsLoading(false);
    };

    if (ticketId) {
      getTicket();
    }
  }, [ticketId]);

  if (isLoading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!ticket) {
    return (
      <div className='font-faNa'>
        اطلاعات برای تیکت با ایدی {ticketId} یافت نشد!
      </div>
    );
  }

  return (
    <div>
      <h1 className='my-2 text-lg font-semibold md:my-3 md:text-2xl'>
        جزییات و پاسخ به تیکت
      </h1>
      <TicketReplyContent
        ticket={ticket}
        setTicket={setTicket}
        ticketId={ticketId}
      />
    </div>
  );
}

export default TicketReplyPage;
