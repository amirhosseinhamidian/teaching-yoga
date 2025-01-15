/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash } from 'react-icons/lu';
import { BsReply } from 'react-icons/bs';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '@/components/modules/Modal/Modal';
import { useRouter } from 'next/navigation';

const TicketTable = ({
  className,
  tickets,
  setTickets,
  page,
  totalPages,
  isLoading,
  onPageChange,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [ticketTempId, setTicketTempId] = useState(null);
  const [showTicketDeleteModal, setShowTicketDeleteModal] = useState(false);

  const handleDeleteTicketModal = (ticketId) => {
    setTicketTempId(ticketId);
    setShowTicketDeleteModal(true);
  };

  const handleDeleteTicket = async () => {
    try {
      toast.showLoadingToast('در حال حذف تیکت');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/ticket`,
        {
          method: 'DELETE',
          headers: {
            id: ticketTempId,
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setTickets(tickets.filter((ticket) => ticket.id !== ticketTempId));
        setTicketTempId(null);
        setShowTicketDeleteModal(false);
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      toast.showLoadingToast('در حال تغییر وضعیت');
      const response = await fetch('/api/admin/ticket/change-status', {
        method: 'PUT',
        headers: {
          id: ticketId,
          status: newStatus,
        },
      });

      if (response.ok) {
        toast.showSuccessToast('وضعیت با موفقیت بروز شد.');
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket,
          ),
        );
      } else {
        toast.showErrorToast('خطا در تغییر وضعیت تیکت');
      }
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطا در تغییر وضعیت تیکت');
    }
  };

  const columns = [
    { key: 'number', label: 'شماره' },
    { key: 'id', label: 'شناسه' },
    {
      key: 'username',
      label: 'نام کاربری',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-1'>
          <Image
            src={row?.avatar || '/images/default-profile.png'}
            alt={row.username}
            className='h-8 w-8 rounded-full object-cover'
            width={64}
            height={64}
          />
          <p>{row.username}</p>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'موضوع',
      minWidth: '150px',
      render: (_, row) => <p className='line-clamp-3 px-2'>{row.title}</p>,
    },

    {
      key: 'course',
      label: 'مرتبط با دوره',
      minWidth: '120px',
      render: (_, row) => row.course?.title || '—',
    },
    {
      key: 'createdAt',
      label: 'تاریخ ایجاد',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getTimeFromDate(row.createdAt)} - ${getShamsiDate(row.createdAt)}`}</p>
      ),
    },

    {
      key: 'updatedAt',
      label: 'بروزرسانی',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getTimeFromDate(row.updatedAt)} - ${getShamsiDate(row.updatedAt)}`}</p>
      ),
    },

    {
      key: 'status',
      minWidth: '150px',
      label: 'وضعیت',
      render: (_, row) => (
        <SimpleDropdown
          className={` ${row.status === 'OPEN' && 'text-blue'} ${row.status === 'ANSWERED' && 'text-green dark:text-accent'} ${row.status === 'IN_PROGRESS' && 'text-secondary'} ${row.status === 'PENDING' && 'text-red'}`}
          options={[
            { label: 'در انتظار بررسی', value: 'PENDING' },
            { label: 'در حال بررسی', value: 'IN_PROGRESS' },
            { label: 'پاسخ داده شده', value: 'ANSWERED' },
            { label: 'باز', value: 'OPEN' },
            { label: 'بسته شده', value: 'CLOSED' },
          ]}
          value={row.status}
          onChange={(newStatus) => handleStatusChange(row.id, newStatus)} // تابعی که وضعیت را در دیتابیس تغییر می‌دهد
        />
      ),
    },
    {
      key: 'actions',
      label: 'عملیات',
      // eslint-disable-next-line no-unused-vars
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <ActionButtonIcon
            color='red'
            icon={LuTrash}
            onClick={() => handleDeleteTicketModal(row.id)}
          />
          <ActionButtonIcon
            color='secondary'
            icon={BsReply}
            onClick={() => {
              router.push(`/a-panel/tickets/reply?ticketId=${row.id}`);
            }}
          />
        </div>
      ),
    },
  ];

  const data = tickets.map((ticket, index) => ({
    number: index + 1 + (page - 1) * 10,
    id: ticket.id,
    course: ticket.course,
    username: ticket.user?.username || 'ناشناس',
    avatar: ticket.user?.avatar,
    userId: ticket.userId,
    updatedAt: ticket.updatedAt,
    createdAt: ticket.createdAt,
    status: ticket.status,
    title: ticket.title,
    description: ticket.description,
    courseId: ticket?.courseId,
    articleId: ticket?.articleId,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={tickets.length === 0}
        emptyText='هیچ تیکتی وجود ندارد.'
      />
      {tickets.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showTicketDeleteModal && (
        <Modal
          title='حذف تیکت'
          desc='با حذف تیکت دیگر دسترسی به آن وجود نخواهد داشت. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setTicketTempId(null);
            setShowTicketDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteTicket}
        />
      )}
    </div>
  );
};

TicketTable.propTypes = {
  className: PropTypes.string,
  tickets: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setTickets: PropTypes.func.isRequired,
};

export default TicketTable;
