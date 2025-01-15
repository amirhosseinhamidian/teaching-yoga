/* eslint-disable no-undef */
'use client';
import React, { useEffect, useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import TicketsSummarySection from '../components/templates/tickets/TicketsSummarySection';
import TicketsTableSection from '../components/templates/tickets/TicketsTableSection';

function TicketAdminPage() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [ticketInfo, setTicketInfo] = useState({});

  const fetchTicketsInfo = async () => {
    try {
      setIsLoadingInfo(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/ticket/info`,
      );
      if (response.ok) {
        const data = await response.json();
        setTicketInfo(data);
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
      <TicketsSummarySection
        isLoading={isLoadingInfo}
        ticketsInfo={ticketInfo}
      />
      <TicketsTableSection />
    </div>
  );
}

export default TicketAdminPage;
