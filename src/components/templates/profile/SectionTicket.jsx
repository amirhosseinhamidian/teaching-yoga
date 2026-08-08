/* eslint-disable no-undef */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Pagination from '@/components/Ui/Pagination/Pagination';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';

import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineTicket,
} from 'react-icons/hi2';

const STATUS_META = {
  PENDING: {
    label: 'در انتظار بررسی',
    cls: 'border-yellow/20 bg-yellow/10 text-yellow',
  },
  IN_PROGRESS: {
    label: 'در حال بررسی',
    cls: 'border-blue/20 bg-blue/10 text-blue',
  },
  ANSWERED: {
    label: 'پاسخ داده شده',
    cls: 'border-secondary/20 bg-secondary/10 text-secondary',
  },
  OPEN: {
    label: 'باز',
    cls: 'border-secondary/20 bg-secondary/10 text-secondary',
  },
  CLOSED: {
    label: 'بسته',
    cls: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300',
  },
};

const SectionTicket = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  const fetchTickets = async (page) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket?page=${page}&perPage=10}`
      );
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
        setTotalPages(data.totalPages);
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(page);
  }, [page]);

  const handleTableRowClick = (row) => {
    router.push(`/ticket/${row.id}`);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-[10px] font-bold text-secondary'>پشتیبانی</p>
          <h3 className='mt-1 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
            تیکت‌های شما
          </h3>
        </div>

        <Link href='/ticket/create'>
          <SiteButton
            type='button'
            variant='primary'
            size='md'
            startIcon={HiOutlinePlus}
          >
            ایجاد تیکت
          </SiteButton>
        </Link>
      </div>

      {isLoading ? (
        <div className='flex min-h-[340px] flex-col items-center justify-center gap-3'>
          <span className='h-8 w-8 animate-spin rounded-full border-[3px] border-secondary/20 border-t-secondary' />
          <span className='text-xs text-subtext-light dark:text-subtext-dark'>
            در حال دریافت تیکت‌ها...
          </span>
        </div>
      ) : tickets.length === 0 ? (
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          className='px-5 py-14 text-center'
        >
          <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
            <HiOutlineTicket size={30} />
          </span>
          <h3 className='mt-4 text-sm font-black text-text-light dark:text-text-dark'>
            تا کنون تیکتی ثبت نکرده‌اید
          </h3>
          <p className='mx-auto mt-2 max-w-sm text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
            اگر درباره دوره‌ها، پرداخت یا حساب کاربری سوالی دارید، می‌توانید یک
            تیکت جدید برای پشتیبانی ثبت کنید.
          </p>
        </SiteCard>
      ) : (
        <div className='space-y-3'>
          {tickets.map((ticket) => {
            const status = STATUS_META[ticket.status] || {
              label: 'نامشخص',
              cls: 'border-black/10 bg-black/5 text-subtext-light dark:border-white/10 dark:bg-white/5 dark:text-subtext-dark',
            };

            return (
              <button
                key={ticket.id}
                type='button'
                onClick={() => handleTableRowClick(ticket)}
                className='group block w-full text-right'
              >
                <SiteCard
                  variant='glass'
                  padding='none'
                  radius='md'
                  hover
                  className='p-4 sm:p-5'
                >
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex min-w-0 items-start gap-3'>
                      <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                        <HiOutlineChatBubbleBottomCenterText size={21} />
                      </span>

                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h4 className='line-clamp-1 text-xs font-black text-text-light transition-colors group-hover:text-secondary sm:text-sm dark:text-text-dark'>
                            {ticket.title}
                          </h4>
                          <span className='font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                            #{Number(ticket.id).toLocaleString('fa-IR')}
                          </span>
                        </div>

                        <div className='mt-2 flex items-center gap-1.5 text-2xs text-subtext-light sm:text-xs dark:text-subtext-dark'>
                          <HiOutlineClock
                            size={14}
                            className='text-secondary'
                          />
                          <span className='font-faNa'>
                            {getTimeFromDate(ticket.updatedAt)}
                            <span className='opacity-40'>•</span>
                            {getShamsiDate(ticket.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-between gap-3 sm:justify-end'>
                      <span
                        className={`rounded-xl border px-2.5 py-1.5 text-[9px] font-black ${status.cls}`}
                      >
                        {status.label}
                      </span>

                      <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-all group-hover:bg-secondary group-hover:text-white'>
                        <HiOutlineArrowLeft size={17} />
                      </span>
                    </div>
                  </div>
                </SiteCard>
              </button>
            );
          })}
        </div>
      )}

      {tickets.length > 9 && (
        <div className='mt-5'>
          <Pagination
            currentPage={page}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
};

export default SectionTicket;
