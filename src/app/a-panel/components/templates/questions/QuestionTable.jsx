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
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '@/components/modules/Modal/Modal';
import { useRouter } from 'next/navigation';

const QuestionTable = ({
  className,
  questions,
  setQuestions,
  page,
  totalPages,
  isLoading,
  onPageChange,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [questionTempId, setQuestionTempId] = useState(null);
  const [showQuestionDeleteModal, setShowQuestionDeleteModal] = useState(false);

  const handleDeleteQuestionModal = (questionId) => {
    setQuestionTempId(questionId);
    setShowQuestionDeleteModal(true);
  };

  const handleDeleteQuestion = async () => {
    try {
      toast.showLoadingToast('در حال حذف سوال');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/question`,
        {
          method: 'DELETE',
          headers: {
            id: questionTempId,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setQuestions(
          questions.filter((question) => question.id !== questionTempId)
        );
        setQuestionTempId(null);
        setShowQuestionDeleteModal(false);
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
      key: 'questionText',
      label: 'متن سوال',
      minWidth: '150px',
      render: (_, row) => (
        <p className='line-clamp-3 px-2'>{row.questionText}</p>
      ),
    },

    {
      key: 'course',
      label: 'دوره',
      minWidth: '120px',
    },
    {
      key: 'session',
      label: 'جلسه',
      minWidth: '120px',
    },
    {
      key: 'createdAt',
      label: 'تاریخ ایجاد',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getTimeFromDate(row.createdAt)} - ${getShamsiDate(row.createdAt)}`}</p>
      ),
    },
    {
      key: 'answeredAt',
      label: 'تاریخ پاسخ',
      render: (_, row) => (
        <p className='whitespace-nowrap'>{`${getTimeFromDate(row.answeredAt)} - ${getShamsiDate(row.answeredAt)}`}</p>
      ),
    },

    {
      key: 'isAnswered',
      minWidth: '80px',
      label: 'وضعیت',
      render: (_, row) => (
        <p
          className={`${row.isAnswered ? 'text-green-light dark:text-green-dark' : 'text-red'} `}
        >
          {row.isAnswered ? 'پاسخ داده شده' : 'پاسخ داده نشده'}
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
            onClick={() => handleDeleteQuestionModal(row.id)}
          />
          <ActionButtonIcon
            color='secondary'
            icon={BsReply}
            onClick={() => {
              router.push(`/a-panel/questions/reply?questionId=${row.id}`);
            }}
          />
        </div>
      ),
    },
  ];

  const data = questions.map((question, index) => ({
    number: index + 1 + (page - 1) * 10,
    id: question.id,
    course: question.course?.title,
    username: question.user?.username || 'ناشناس',
    avatar: question.user?.avatar,
    userId: question.userId,
    answeredAt: question.answeredAt,
    createdAt: question.createdAt,
    isAnswered: question.isAnswered,
    questionText: question.questionText,
    session: question.session?.name,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={questions.length === 0}
        emptyText='هیچ سوالی وجود ندارد.'
      />
      {questions.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showQuestionDeleteModal && (
        <Modal
          title='حذف سوال'
          desc='با حذف سوال دیگر دسترسی به آن وجود نخواهد داشت. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setQuestionTempId(null);
            setShowQuestionDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteQuestion}
        />
      )}
    </div>
  );
};

QuestionTable.propTypes = {
  className: PropTypes.string,
  questions: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setQuestions: PropTypes.func.isRequired,
};

export default QuestionTable;
