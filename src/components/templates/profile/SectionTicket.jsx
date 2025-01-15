/* eslint-disable no-undef */
'use client';
import Button from '@/components/Ui/Button/Button';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Table from '@/components/Ui/Table/Table';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

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
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ticket?page=${page}&perPage=10}`,
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

  const columns = [
    { key: 'id', label: 'شماره' },
    {
      key: 'title',
      label: 'موضوع',
      minWidth: '150px',
    },
    {
      key: 'updatedAt',
      label: 'آخرین بروزرسانی',
      render: (date) => (
        <p className='whitespace-nowrap'>
          {getTimeFromDate(date)} {'  '} {getShamsiDate(date)}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'وضعیت',
      render: (status) => {
        const statusMap = {
          PENDING: {
            label: 'در انتظار بررسی',
            bg: 'bg-secondary',
            text: 'text-secondary whitespace-nowrap',
          },
          IN_PROGRESS: {
            label: 'در حال بررسی',
            bg: 'bg-blue',
            text: 'text-blue whitespace-nowrap',
          },
          ANSWERED: {
            label: 'پاسخ داده شده',
            bg: 'bg-red',
            text: 'text-red whitespace-nowrap',
          },
          OPEN: {
            label: 'باز',
            bg: 'bg-green',
            text: 'text-green dark:text-accent whitespace-nowrap',
          },
          CLOSED: {
            label: 'بسته',
            bg: 'bg-purple-600',
            text: 'text-purple-600 whitespace-nowrap',
          },
        };
        const statusStyle = statusMap[status] || {
          label: 'نامشخص',
          bg: 'bg-gray-100',
          text: 'text-gray-600 whitespace-nowrap',
        };
        return (
          <span
            className={clsx(
              'rounded-full bg-opacity-10 px-3 py-1',
              statusStyle.bg,
              statusStyle.text,
            )}
          >
            {statusStyle.label}
          </span>
        );
      },
    },
  ];

  const data = tickets?.map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    updatedAt: ticket.updatedAt,
  }));

  const handleTableRowClick = (row) => {
    router.push(`/ticket/${row.id}`);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  return (
    <div>
      <Link href='/ticket/create'>
        <Button shadow className='flex items-center justify-center gap-1'>
          <FaPlus />
          ایجاد تیکت
        </Button>
      </Link>
      <div className='mt-6 border-b border-gray-300 dark:border-gray-600'></div>
      <Table
        columns={columns}
        data={data}
        className='mb-3 mt-6 sm:mb-4 lg:w-4/5 xl:w-2/3'
        loading={isLoading}
        empty={tickets.length === 0}
        emptyText='تا کنون تیکتی ثبت نکرده اید.'
        onClickRow={(row) => handleTableRowClick(row)}
      />
      {tickets.length > 9 && (
        <Pagination
          currentPage={page}
          onPageChange={handlePageChange}
          totalPages={totalPages}
        />
      )}
    </div>
  );
};

export default SectionTicket;
