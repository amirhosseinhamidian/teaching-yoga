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
  courseId,
  onCommentAdded,
  onCloseClick,
}) => {
  const [content, setContent] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const [sendLoading, setSendLoading] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const loginClickHandler = () => {
    sessionStorage.setItem('previousPage', pathname);
    router.push('/login');
  };

  const sendCommentHandler = async () => {
    if (!content || content.length < 10) {
      toast.showErrorToast('حداقل نظر قابل قبول 10 کارکتر است');
      return;
    }
    setSendLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          content,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        toast.showErrorToast(`خطا در ارسال نظر`);
      } else {
        const newComment = await res.json();
        toast.showSuccessToast(
          'نظر شما با موفقیت ارسال شد، بعد از تایید منتشر می شود.',
        );
        setContent('');
        onCloseClick();
        onCommentAdded(newComment);
      }
    } catch (error) {
      toast.showErrorToast(
        'خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید.',
      );
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <>
      {user ? (
        <div className='flex flex-col gap-4 pb-5'>
          <div className='flex items-center gap-2'>
            <Image
              src={user.avatar}
              alt='user profile'
              width={50}
              height={50}
              className='rounded-full'
            />
            <p className='text-subtext-light dark:text-subtext-dark'>
              {user.username}
            </p>
          </div>
          <TextArea
            placeholder='نظرت رو بنویس'
            value={content}
            onChange={setContent}
            className='sm:mx-6'
          />
          <div className='flex w-full items-center justify-end gap-2 sm:pl-6'>
            <OutlineButton onClick={() => onCloseClick()}>لغو</OutlineButton>
            <Button onClick={sendCommentHandler} isLoading={sendLoading}>
              ارسال
            </Button>
          </div>
        </div>
      ) : (
        <div className='my-8 flex flex-col items-center gap-6'>
          <p className='font-extralight'>
            برای ثبت نظر نیاز است ابتدا وارد حساب کاربری خود شوید یا ثبت نام
            کنید.
          </p>
          <Button onClick={loginClickHandler}>ورود به حساب | ثبت نام</Button>
        </div>
      )}
    </>
  );
};

CreateCommentCard.propTypes = {
  user: PropTypes.object.isRequired,
  courseId: PropTypes.number.isRequired,
  onCloseClick: PropTypes.func.isRequired,
  onCommentAdded: PropTypes.func.isRequired,
};

export default CreateCommentCard;
