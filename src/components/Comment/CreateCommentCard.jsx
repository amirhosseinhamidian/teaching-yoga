/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import TextArea from '../Ui/TextArea/TextArea';
import OutlineButton from '../Ui/OutlineButton/OutlineButton';
import Button from '../Ui/Button/Button';
import { useRouter, usePathname } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const CreateCommentCard = ({
  user,
  referenceId,
  onCommentAdded,
  onCloseClick,
  isCourse,
}) => {
  const [content, setContent] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const loginClickHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  // ===============================
  // 🔵 ارسال کامنت
  // ===============================
  const sendCommentHandler = async () => {
    if (!content || content.length < 10) {
      toast.showErrorToast('حداقل نظر قابل قبول ۱۰ کارکتر است');
      return;
    }

    if (!user) {
      toast.showErrorToast('برای ثبت نظر باید وارد شوید.');
      return;
    }

    const payload = {
      content,
      ...(isCourse ? { courseId: referenceId } : { articleId: referenceId }),
    };

    const url = isCourse
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/comments-article`;

    setSendLoading(true);

    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include', // JWT کوکی به صورت خودکار ارسال می‌شود
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        toast.showErrorToast('خطا در ارسال نظر');
        return;
      }

      const newComment = await res.json();

      toast.showSuccessToast(
        'نظر شما با موفقیت ثبت شد، پس از تایید نمایش داده خواهد شد.'
      );

      setContent('');
      onCloseClick();
      onCommentAdded(newComment);
    } catch (err) {
      toast.showErrorToast('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <>
      {user ? (
        <div className='flex flex-col gap-4 pb-5'>
          {/* User Info */}
          <div className='flex items-center gap-2'>
            <Image
              src={user.avatar || '/images/default-profile.png'}
              alt='user profile'
              width={50}
              height={50}
              className='h-9 w-9 rounded-full border xs:h-11 xs:w-11 sm:h-14 sm:w-14'
            />
            <p className='text-subtext-light dark:text-subtext-dark'>
              {user.username}
            </p>
          </div>

          {/* Textarea */}
          <TextArea
            placeholder='نظرت رو بنویس…'
            value={content}
            onChange={setContent}
          />

          {/* Buttons */}
          <div className='flex w-full items-center justify-end gap-2 sm:pl-6'>
            <OutlineButton onClick={onCloseClick}>لغو</OutlineButton>

            <Button onClick={sendCommentHandler} isLoading={sendLoading}>
              ارسال
            </Button>
          </div>
        </div>
      ) : (
        // Guest (not logged in)
        <div className='my-8 flex flex-col items-center gap-6'>
          <p className='text-center font-extralight'>
            برای ثبت نظر نیاز است ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام
            کنید.
          </p>
          <Button onClick={loginClickHandler}>ورود به حساب | ثبت‌نام</Button>
        </div>
      )}
    </>
  );
};

CreateCommentCard.propTypes = {
  user: PropTypes.object,
  referenceId: PropTypes.number.isRequired,
  onCloseClick: PropTypes.func.isRequired,
  onCommentAdded: PropTypes.func.isRequired,
  isCourse: PropTypes.bool.isRequired,
};

export default CreateCommentCard;
