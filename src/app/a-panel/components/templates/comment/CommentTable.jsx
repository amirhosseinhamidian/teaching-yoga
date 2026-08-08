// CommentTable.jsx

/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';

import Table from '@/components/Ui/Table/Table';
import Pagination from '@/components/Ui/Pagination/Pagination';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';
import SimpleDropdown from '@/components/Ui/SimpleDropDown/SimpleDropDown';
import Modal from '@/components/modules/Modal/Modal';
import CommentReplyModal from '../../modules/CommentReplyModal/CommentReplyModal';

import { getShamsiDate } from '@/utils/dateTimeHelper';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

import { LuSave, LuTrash } from 'react-icons/lu';
import { BsReply } from 'react-icons/bs';
import { ImSpinner2 } from 'react-icons/im';

const CommentTable = ({
  className = '',
  comments,
  setComments,
  page,
  totalPages,
  isLoading,
  onPageChange,
  type,
}) => {
  const { isDark } = useTheme();

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const [commentTempId, setCommentTempId] = useState(null);
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);

  const [commentTemp, setCommentTemp] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const [homepageSavingId, setHomepageSavingId] = useState(null);
  const [homeOrderDrafts, setHomeOrderDrafts] = useState({});

  useEffect(() => {
    const drafts = {};

    comments.forEach((comment) => {
      drafts[comment.id] =
        comment.homeOrder === null || comment.homeOrder === undefined
          ? ''
          : String(comment.homeOrder);
    });

    setHomeOrderDrafts(drafts);
  }, [comments]);

  const handleDeleteCommentModal = (commentId) => {
    setCommentTempId(commentId);
    setShowCommentDeleteModal(true);
  };

  const handleDeleteComment = async () => {
    if (!commentTempId) {
      return;
    }

    try {
      toast.showLoadingToast('در حال حذف نظر');

      const response = await fetch('/api/admin/comment', {
        method: 'DELETE',
        headers: {
          id: String(commentTempId),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'حذف نظر انجام نشد');
      }

      toast.showSuccessToast(data?.message || 'نظر حذف شد');

      setComments((previousComments) =>
        previousComments.filter((comment) => comment.id !== commentTempId)
      );

      setCommentTempId(null);
      setShowCommentDeleteModal(false);
    } catch (error) {
      console.error('[DELETE_COMMENT_ERROR]', error);
      toast.showErrorToast(error?.message || 'خطا در حذف نظر');
    }
  };

  const updateHomepageSettings = async ({
    commentId,
    showOnHome,
    homeOrder,
    successMessage,
  }) => {
    try {
      setHomepageSavingId(commentId);

      const normalizedOrder =
        showOnHome &&
        homeOrder !== '' &&
        homeOrder !== null &&
        homeOrder !== undefined
          ? Math.max(Number.parseInt(homeOrder, 10), 1)
          : null;

      const response = await fetch('/api/admin/comment/home-display', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          showOnHome: Boolean(showOnHome),
          homeOrder: normalizedOrder,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || 'تنظیمات نمایش نظر در صفحه اصلی ذخیره نشد'
        );
      }

      const updatedComment = data?.comment;

      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                showOnHome: updatedComment?.showOnHome ?? Boolean(showOnHome),
                homeOrder: updatedComment?.homeOrder ?? normalizedOrder,
              }
            : comment
        )
      );

      setHomeOrderDrafts((previousDrafts) => ({
        ...previousDrafts,
        [commentId]:
          updatedComment?.homeOrder === null ||
          updatedComment?.homeOrder === undefined
            ? ''
            : String(updatedComment.homeOrder),
      }));

      toast.showSuccessToast(
        data?.message || successMessage || 'تنظیمات صفحه اصلی ذخیره شد'
      );
    } catch (error) {
      console.error('[UPDATE_COMMENT_HOME_DISPLAY_ERROR]', error);

      toast.showErrorToast(error?.message || 'خطا در ذخیره تنظیمات صفحه اصلی');
    } finally {
      setHomepageSavingId(null);
    }
  };

  const handleHomepageToggle = (comment) => {
    if (comment.status !== 'APPROVED') {
      toast.showErrorToast('ابتدا وضعیت نظر را تأیید کنید');
      return;
    }

    const nextValue = !comment.showOnHome;

    updateHomepageSettings({
      commentId: comment.id,
      showOnHome: nextValue,
      homeOrder: nextValue ? homeOrderDrafts[comment.id] : null,
      successMessage: nextValue
        ? 'نظر برای صفحه اصلی انتخاب شد'
        : 'نظر از صفحه اصلی حذف شد',
    });
  };

  const handleSaveHomeOrder = (comment) => {
    if (!comment.showOnHome) {
      toast.showErrorToast('ابتدا نمایش نظر در صفحه اصلی را فعال کنید');
      return;
    }

    updateHomepageSettings({
      commentId: comment.id,
      showOnHome: true,
      homeOrder: homeOrderDrafts[comment.id],
      successMessage: 'ترتیب نمایش نظر ذخیره شد',
    });
  };

  const handleStatusChange = async (commentId, newStatus) => {
    try {
      toast.showLoadingToast('در حال تغییر وضعیت');

      const response = await fetch('/api/admin/comment/change-status', {
        method: 'PUT',
        headers: {
          id: String(commentId),
          status: newStatus,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'خطا در تغییر وضعیت نظر');
      }

      setComments((previousComments) =>
        previousComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                status: newStatus,
                showOnHome:
                  newStatus === 'APPROVED' ? comment.showOnHome : false,
                homeOrder: newStatus === 'APPROVED' ? comment.homeOrder : null,
              }
            : comment
        )
      );

      if (newStatus !== 'APPROVED') {
        setHomeOrderDrafts((previousDrafts) => ({
          ...previousDrafts,
          [commentId]: '',
        }));
      }

      toast.showSuccessToast(data?.message || 'وضعیت نظر تغییر کرد');
    } catch (error) {
      console.error('[CHANGE_COMMENT_STATUS_ERROR]', error);

      toast.showErrorToast(error?.message || 'خطا در تغییر وضعیت نظر');
    }
  };

  const handleReplyModal = (comment) => {
    setCommentTemp(comment);
    setShowReplyModal(true);
  };

  const handleSubmitReply = (newReply) => {
    setComments((previousComments) =>
      previousComments.map((comment) => {
        if (comment.id !== newReply.parentId) {
          return comment;
        }

        return {
          ...comment,
          replies: [
            ...(comment.replies || []),
            {
              id: newReply.id,
              content: newReply.content,
              createAt: newReply.createAt,
            },
          ],
          updatedAt: newReply.updatedAt,
        };
      })
    );

    setCommentTemp(null);
    setShowReplyModal(false);
  };

  const columns = [
    {
      key: 'number',
      label: 'شماره',
    },
    {
      key: 'username',
      label: 'نام کاربری',
      minWidth: '140px',
      render: (_, row) => (
        <div className='flex items-center justify-center gap-2'>
          <Image
            src={row.avatar || '/images/default-profile.png'}
            alt={row.username}
            className='h-9 w-9 shrink-0 rounded-full object-cover'
            width={72}
            height={72}
          />

          <div className='min-w-0 text-right'>
            <p className='max-w-28 truncate text-sm'>{row.username}</p>

            {(row.firstname || row.lastname) && (
              <p className='mt-0.5 max-w-28 truncate text-[10px] text-subtext-light dark:text-subtext-dark'>
                {[row.firstname, row.lastname].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: type === 'course' ? 'course' : 'article',
      label: type === 'course' ? 'دوره' : 'مقاله',
      minWidth: '140px',
      render: (_, row) =>
        type === 'course'
          ? row.course?.title || '—'
          : row.article?.title || '—',
    },
    {
      key: 'content',
      label: 'نظر کاربر',
      minWidth: '200px',
      render: (_, row) => (
        <p className='line-clamp-5 leading-7'>{row.content}</p>
      ),
    },
    {
      key: 'replyContent',
      label: 'پاسخ',
      minWidth: '180px',
      render: (_, row) =>
        Array.isArray(row.replies) && row.replies.length > 0 ? (
          <div className='space-y-2'>
            {row.replies.map((reply) => (
              <p className='line-clamp-4 leading-6' key={reply.id}>
                {reply.content}
              </p>
            ))}
          </div>
        ) : (
          <p className='text-red'>بدون پاسخ</p>
        ),
    },
    {
      key: 'createAt',
      label: 'تاریخ',
      minWidth: '110px',
      render: (date) => getShamsiDate(date),
    },
    {
      key: 'status',
      minWidth: '150px',
      label: 'وضعیت',
      render: (_, row) => (
        <SimpleDropdown
          className={`${
            row.status === 'APPROVED'
              ? 'text-green-light dark:text-green-dark'
              : ''
          } ${row.status === 'REJECTED' ? 'text-red' : ''} ${
            row.status === 'PENDING' ? 'text-secondary' : ''
          }`}
          options={[
            {
              label: 'تأیید شده',
              value: 'APPROVED',
            },
            {
              label: 'رد شده',
              value: 'REJECTED',
            },
            {
              label: 'در انتظار تأیید',
              value: 'PENDING',
            },
          ]}
          value={row.status}
          onChange={(newStatus) => handleStatusChange(row.id, newStatus)}
        />
      ),
    },

    ...(type === 'course'
      ? [
          {
            key: 'showOnHome',
            label: 'نمایش در صفحه اول',
            minWidth: '180px',
            render: (_, row) => {
              const isSaving = homepageSavingId === row.id;

              const isApproved = row.status === 'APPROVED';

              return (
                <div className='flex flex-col items-center gap-2'>
                  <button
                    type='button'
                    role='switch'
                    aria-checked={row.showOnHome}
                    aria-label='نمایش نظر در صفحه اصلی'
                    disabled={!isApproved || isSaving}
                    onClick={() => handleHomepageToggle(row)}
                    className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
                      row.showOnHome
                        ? 'bg-secondary'
                        : 'bg-gray-300 dark:bg-white/15'
                    } ${
                      !isApproved || isSaving
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        row.showOnHome ? 'left-1' : 'right-1'
                      }`}
                    />

                    {isSaving && (
                      <span className='absolute inset-0 flex items-center justify-center'>
                        <ImSpinner2 className='animate-spin text-xs text-white' />
                      </span>
                    )}
                  </button>

                  <span
                    className={`text-[10px] ${
                      row.showOnHome
                        ? 'text-secondary'
                        : 'text-subtext-light dark:text-subtext-dark'
                    }`}
                  >
                    {!isApproved
                      ? 'ابتدا تأیید شود'
                      : row.showOnHome
                        ? 'فعال'
                        : 'غیرفعال'}
                  </span>
                </div>
              );
            },
          },
          {
            key: 'homeOrder',
            label: 'ترتیب نمایش',
            minWidth: '150px',
            render: (_, row) => {
              const isSaving = homepageSavingId === row.id;

              return (
                <div className='flex items-center justify-center gap-2'>
                  <input
                    type='number'
                    min='1'
                    inputMode='numeric'
                    value={homeOrderDrafts[row.id] ?? ''}
                    disabled={!row.showOnHome || isSaving}
                    onChange={(event) => {
                      const value = event.target.value;

                      setHomeOrderDrafts((previousDrafts) => ({
                        ...previousDrafts,
                        [row.id]: value,
                      }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSaveHomeOrder(row);
                      }
                    }}
                    placeholder='مثلاً ۱'
                    className='h-10 w-20 rounded-xl border border-black/10 bg-background-light px-2 text-center font-faNa text-sm outline-none transition focus:border-secondary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-background-dark'
                  />

                  <button
                    type='button'
                    onClick={() => handleSaveHomeOrder(row)}
                    disabled={!row.showOnHome || isSaving}
                    aria-label='ذخیره ترتیب نمایش'
                    className='flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition hover:bg-secondary hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
                  >
                    {isSaving ? (
                      <ImSpinner2 className='animate-spin' />
                    ) : (
                      <LuSave size={18} />
                    )}
                  </button>
                </div>
              );
            },
          },
        ]
      : []),

    {
      key: 'actions',
      label: 'عملیات',
      minWidth: '110px',
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

    id: comment.id,
    userId: comment.userId,

    username: comment.user?.username || 'ناشناس',
    avatar: comment.user?.avatar,
    firstname: comment.user?.firstname,
    lastname: comment.user?.lastname,

    course: comment.course,
    article: comment.article,
    courseId: comment.courseId,
    articleId: comment.articleId,

    content: comment.content,
    replies: comment.replies,

    status: comment.status,
    showOnHome: Boolean(comment.showOnHome),
    homeOrder: comment.homeOrder === undefined ? null : comment.homeOrder,

    createAt: comment.createAt,
    updatedAt: comment.updatedAt,
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

      {comments.length > 0 && (
        <Pagination
          currentPage={page}
          onPageChange={onPageChange}
          totalPages={totalPages}
        />
      )}

      {showCommentDeleteModal && (
        <Modal
          title='حذف نظر'
          desc='با حذف نظر کاربر، این نظر به‌طور کامل پاک می‌شود و دیگر امکان بازیابی آن وجود ندارد. آیا از حذف مطمئن هستید؟'
          icon={LuTrash}
          primaryButtonText='خیر'
          secondaryButtonText='بله'
          primaryButtonClick={() => {
            setCommentTempId(null);
            setShowCommentDeleteModal(false);
          }}
          secondaryButtonClick={handleDeleteComment}
        />
      )}

      {showReplyModal && (
        <CommentReplyModal
          comment={commentTemp}
          onClose={() => {
            setShowReplyModal(false);
            setCommentTemp(null);
          }}
          onSuccess={handleSubmitReply}
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
