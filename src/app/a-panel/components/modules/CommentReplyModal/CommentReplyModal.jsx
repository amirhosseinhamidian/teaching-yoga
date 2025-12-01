'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Ui/Button/Button';
import Image from 'next/image';
import { getShamsiDate, getTimeFromDate } from '@/utils/dateTimeHelper';
import TextArea from '@/components/Ui/TextArea/TextArea';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const CommentReplyModal = ({ onClose, onSuccess, comment }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // IMPORTANT: فقط کاربر لاگین شده واقعی
  const { user } = useAuthUser();

  const [isLoading, setIsLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyTextError, setReplyTextError] = useState('');
  const isCourse = !!comment.courseId;

  const submitReply = async () => {
    if (!replyText.trim()) {
      setReplyTextError('متنی برای پاسخ نظر کاربر بنویسید.');
      return;
    }

    try {
      setIsLoading(true);
      setReplyTextError('');

      const replyData = {
        content: replyText,
        userId: user?.id, // کاربر از Redux (authUser)
        parentId: comment.id,
        ...(isCourse
          ? { courseId: comment.courseId }
          : { articleId: comment.articleId }),
      };

      const response = await fetch('/api/admin/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replyData),
      });

      if (!response.ok) throw new Error('ثبت پاسخ نا موفق بود!');

      const result = await response.json();
      onSuccess(result);
      toast.showSuccessToast('پاسخ با موفقیت ثبت شد.');
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.showErrorToast('ثبت پاسخ نا موفق بود!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative max-h-screen w-11/12 overflow-y-auto rounded-xl bg-surface-light p-6 xs:w-5/6 sm:w-2/3 dark:bg-background-dark'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            جزییات و پاسخ به نظر
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>

        {/* Comment Info */}
        <div className='mt-6 flex flex-wrap items-center gap-2'>
          <Image
            src={comment?.avatar || '/images/default-profile.png'}
            alt={comment.username}
            className='h-12 w-12 rounded-full md:h-14 md:w-14 xl:h-20 xl:w-20'
            width={96}
            height={96}
          />

          <div className='flex flex-col text-xs sm:text-sm'>
            <h4>
              {comment?.firstname} {comment?.lastname}
            </h4>
            <h4>{comment.username}</h4>
            <h4>{isCourse ? comment.course.title : comment.article.title}</h4>

            <h4 className='font-faNa'>
              تاریخ آخرین بروزرسانی: {getTimeFromDate(comment.updatedAt)} –{' '}
              {getShamsiDate(comment.updatedAt)}
            </h4>
          </div>
        </div>

        {/* Original Comment */}
        <div className='mt-6 flex flex-col rounded-xl border border-subtext-light p-4 text-subtext-light sm:p-6 dark:border-subtext-dark dark:text-subtext-dark'>
          <h4 className='mb-2 font-semibold sm:mb-3'>نظر کاربر:</h4>

          <p className='text-xs sm:text-sm'>{comment.content}</p>

          <h5 className='mt-3 self-end font-faNa text-2xs sm:text-xs'>
            {getTimeFromDate(comment.createAt)} –{' '}
            {getShamsiDate(comment.createAt)}
          </h5>
        </div>

        {/* Reply input */}
        <TextArea
          value={replyText}
          onChange={setReplyText}
          placeholder='پاسخ به نظر کاربر را بنویسید ... '
          fullWidth
          errorMessage={replyTextError}
          className='mt-6 bg-surface-light text-xs md:text-base dark:bg-surface-dark'
        />

        {/* Submit */}
        <div className='flex w-full items-center justify-center'>
          <Button
            shadow
            isLoading={isLoading}
            className='mt-6 sm:w-2/3 lg:w-1/3'
            onClick={submitReply}
          >
            ثبت
          </Button>
        </div>
      </div>
    </div>
  );
};

CommentReplyModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  comment: PropTypes.object.isRequired,
};

export default CommentReplyModal;
