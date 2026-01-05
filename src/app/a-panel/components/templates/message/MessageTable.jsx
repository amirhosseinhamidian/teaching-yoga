/* eslint-disable no-undef */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Image from 'next/image';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash } from 'react-icons/lu';
import { BsReply } from 'react-icons/bs';
import Modal from '@/components/modules/Modal/Modal';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import Pagination from '@/components/Ui/Pagination/Pagination';
import { useRouter } from 'next/navigation';

const MessageTable = ({
  className,
  sessions,
  setSessions,
  page,
  totalPages,
  isLoading,
  onPageChange,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [sessionTempId, setSessionTempId] = useState(null);
  const [showSessionDeleteModal, setShowSessionDeleteModal] = useState(false);

  const handleDeleteSessionModal = (sessionId) => {
    setSessionTempId(sessionId);
    setShowSessionDeleteModal(true);
  };

  const handleDeleteSession = async () => {
    try {
      toast.showLoadingToast('در حال حذف چت کاربر');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/message`,
        {
          method: 'DELETE',
          headers: {
            id: sessionTempId,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setSessions((prevSessions) =>
          prevSessions.filter((session) => session.sessionId !== sessionTempId)
        );
        setSessionTempId(null);
        setShowSessionDeleteModal(false);
      } else {
        toast.showErrorToast(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns = [
    { key: 'number', label: 'شماره' },
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
      key: 'lastMessage',
      label: 'متن آخرین پیام',
      minWidth: '150px',
      render: (_, row) => (
        <p className='line-clamp-3 px-2'>{row.lastMessage}</p>
      ),
    },

    {
      key: 'createdAt',
      label: 'تاریخ آخرین پیام',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getTimeFromDate(row.createdAt)} - ${getShamsiDate(row.createdAt)}`}</p>
      ),
    },

    {
      key: 'isSeen',
      minWidth: '80px',
      label: 'وضعیت',
      render: (_, row) => (
        <p
          className={`${row.isSeen ? 'text-green-light dark:text-green-dark' : 'text-red'} `}
        >
          {row.isSeen ? 'دیده شده' : 'دیده نشده'}
        </p>
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
            onClick={() => handleDeleteSessionModal(row.id)}
          />
          <ActionButtonIcon
            color='secondary'
            icon={BsReply}
            onClick={() => {
              router.push(`/a-panel/message/reply?sessionId=${row.id}`);
            }}
          />
        </div>
      ),
    },
  ];

  const data = sessions?.map((session, index) => ({
    number: index + 1 + (page - 1) * 10,
    id: session.sessionId,
    username: session?.username || 'ناشناس',
    avatar: session?.avatar,
    userId: session?.userId,
    anonymousId: session.anonymousId,
    lastMessage: session.lastMessage,
    isSeen: session.isSeen,
    createdAt: session.createdAt,
  }));
  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={sessions.length === 0}
        emptyText='هیچ سوالی وجود ندارد.'
      />
      {sessions.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showSessionDeleteModal && (
        <Modal
          title='حذف چت کاربر'
          desc='با حذف چت کاربر دیگر دسترسی به آن وجود نخواهد داشت. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setSessionTempId(null);
            setShowSessionDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteSession}
        />
      )}
    </div>
  );
};

MessageTable.propTypes = {
  className: PropTypes.string,
  sessions: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setSessions: PropTypes.func.isRequired,
};

export default MessageTable;
