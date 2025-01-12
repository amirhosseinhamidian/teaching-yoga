/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import { LuTrash } from 'react-icons/lu';
import { BsReply } from 'react-icons/bs';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from '@/components/modules/Modal/Modal';
import CommentReplyModal from '../../modules/CommentReplyModal/CommentReplyModal';

const CommentTable = ({
  className,
  comments,
  setComments,
  page,
  totalPages,
  isLoading,
  onPageChange,
  type,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [commentTempId, setCommentTempId] = useState(null);
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [commentTemp, setCommentTemp] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const handleDeleteCommentModal = (commentId) => {
    setCommentTempId(commentId);
    setShowCommentDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    try {
      toast.showLoadingToast('در حال حذف نظر');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/comment`,
        {
          method: 'DELETE',
          headers: {
            id: commentTempId,
          },
        },
      );

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast(data.message);
        setComments(comments.filter((comment) => comment.id !== commentTempId));
        setCommentTempId(null);
        setShowCommentDeleteModal(false);
      } else {
        toast.showErrorToast(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (commentId, newStatus) => {
    try {
      toast.showLoadingToast('در حال تغییر وضعیت');
      const response = await fetch('/api/admin/comment/change-status', {
        method: 'PUT',
        headers: {
          id: commentId,
          status: newStatus,
        },
      });

      if (response.ok) {
        const result = await response.json();
        toast.showSuccessToast(result.message);
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, status: newStatus }
              : comment,
          ),
        );
      } else {
        toast.showErrorToast('خطا در تغییر وضعیت نظر');
      }
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطا در تغییر وضعیت نظر');
    }
  };

  const handleReplyModal = (comment) => {
    setCommentTemp(comment);
    setShowReplyModal(true);
  };

  const handleSubmitReply = (newReply) => {
    setComments((prevComments) => {
      return prevComments.map((comment) => {
        // بررسی اگر این کامنت همان کامنت والد است
        if (comment.id === newReply.parentId) {
          return {
            ...comment,
            replies: [
              ...(comment.replies || []), // اگر `replies` وجود ندارد، آرایه خالی استفاده شود
              {
                id: newReply.id,
                content: newReply.content,
                createAt: newReply.createAt,
              },
            ],
            updatedAt: newReply.updatedAt, // به‌روزرسانی زمان
          };
        }
        return comment; // کامنت‌های دیگر بدون تغییر
      });
    });

    setCommentTemp(null);
    setShowReplyModal(false);
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
      key: type === 'course' ? 'course' : 'article',
      label: type === 'course' ? 'دوره' : 'مقاله',
      minWidth: '120px',
      render: (_, row) =>
        type === 'course' ? row.course?.title : row.article?.title || '—',
    },
    {
      key: 'content',
      label: 'نظر کاربر',
      minWidth: '150px',
      render: (_, row) => <p className='line-clamp-5'>{row.content}</p>,
    },
    {
      key: 'replyContent',
      label: 'پاسخ',
      minWidth: '150px',
      render: (_, row) =>
        row.replies && row.replies.length > 0 ? (
          row.replies.map((reply) => (
            <p className='line-clamp-5' key={reply.id}>
              {reply.content}
            </p>
          ))
        ) : (
          <p className='text-red'>بدون پاسخ</p>
        ),
    },
    {
      key: 'createAt',
      label: 'تاریخ',
      render: (date) => getShamsiDate(date),
    },

    {
      key: 'status',
      minWidth: '150px',
      label: 'وضعیت',
      render: (_, row) => (
        <SimpleDropdown
          className={`${row.status === 'APPROVED' && 'text-green dark:text-accent'} ${row.status === 'REJECTED' && 'text-red'} ${row.status === 'PENDING' && 'text-secondary'}`}
          options={[
            { label: 'تایید شده', value: 'APPROVED' },
            { label: 'رد شده', value: 'REJECTED' },
            { label: 'در انتظار تایید', value: 'PENDING' },
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
            onClick={() => handleDeleteCommentModal(row.id)}
          />
          <ActionButtonIcon
            color='secondary'
            icon={BsReply}
            onClick={() => handleReplyModal(row)}
          />
        </div>
      ),
    },
  ];

  const data = comments.map((comment, index) => ({
    number: index + 1 + (page - 1) * 10,
    course: comment.course,
    article: comment.article,
    username: comment.user?.username || 'ناشناس',
    avatar: comment.user?.avatar,
    firstname: comment.user?.firstname,
    lastname: comment.user?.lastname,
    userId: comment.userId,
    updatedAt: comment.updatedAt,
    createAt: comment.createAt,
    status: comment.status,
    content: comment.content,
    replies: comment.replies,
    courseId: comment?.courseId,
    articleId: comment?.articleId,
    id: comment.id,
  }));

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        className='mb-3 sm:mb-4'
        loading={isLoading}
        empty={comments.length === 0}
        emptyText='هیچ نظری وجود ندارد.'
      />
      {comments.length !== 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}
      {showCommentDeleteModal && (
        <Modal
          title='حذف نظر'
          desc='با حذف نظر کاربر این نظر به طور کامل پاک خواهد شد و دیگر دسترسی به آن وجود نخواهد داشت. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setCommentTempId(null);
            setShowCommentDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteCourse}
        />
      )}
      {showReplyModal && (
        <CommentReplyModal
          comment={commentTemp}
          onClose={() => {
            setShowReplyModal(false);
            setCommentTemp(null);
          }}
          onSuccess={(newReply) => handleSubmitReply(newReply)}
        />
      )}
    </div>
  );
};

CommentTable.propTypes = {
  className: PropTypes.string,
  comments: PropTypes.array.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onPageChange: PropTypes.func.isRequired,
  setComments: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['course', 'article']).isRequired,
};

export default CommentTable;
