/* eslint-disable no-undef */

'use client';

import React, { useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Image from 'next/image';

import { usePathname, useRouter } from 'next/navigation';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

import { LuLogIn } from 'react-icons/lu';

import {
  HiOutlineArrowLeft,
  HiOutlineCheckBadge,
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
} from 'react-icons/hi2';

const DEFAULT_AVATAR = '/images/default-profile.png';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const getSafeImageSrc = (src) => {
  if (typeof src !== 'string') {
    return DEFAULT_AVATAR;
  }

  const value = src.trim();

  if (!value || value.startsWith('blob:') || value.startsWith('data:')) {
    return DEFAULT_AVATAR;
  }

  if (value.startsWith('/')) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return value;
    }
  } catch {
    return DEFAULT_AVATAR;
  }

  return DEFAULT_AVATAR;
};

const getUserDisplayName = (user) => {
  if (user?.username) {
    return user.username;
  }

  const firstName = user?.firstname || user?.firstName || '';

  const lastName = user?.lastname || user?.lastName || '';

  return `${firstName} ${lastName}`.trim() || 'کاربر';
};

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

  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const normalizedContent = content.trim();

  const isContentValid = normalizedContent.length >= 10;

  const loginClickHandler = () => {
    sessionStorage.setItem('previousPage', pathname);

    router.push('/login');
  };

  const sendCommentHandler = async () => {
    if (sendLoading) {
      return;
    }

    if (!isContentValid) {
      toast.showErrorToast('متن دیدگاه باید حداقل ۱۰ کاراکتر باشد.');

      return;
    }

    if (!user) {
      toast.showErrorToast('برای ثبت دیدگاه ابتدا وارد حساب کاربری شوید.');

      return;
    }

    const payload = {
      content: normalizedContent,

      ...(isCourse
        ? {
            courseId: referenceId,
          }
        : {
            articleId: referenceId,
          }),
    };

    const apiBaseUrl = getApiBaseUrl();

    const url = isCourse
      ? `${apiBaseUrl}/api/comments`
      : `${apiBaseUrl}/api/comments-article`;

    try {
      setSendLoading(true);

      const response = await fetch(url, {
        method: 'POST',

        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',

          Accept: 'application/json',
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || result?.message || 'ارسال دیدگاه انجام نشد.'
        );
      }

      const newComment = result?.comment || result?.data || result;

      toast.showSuccessToast(
        'دیدگاه شما ثبت شد و پس از تأیید نمایش داده می‌شود.'
      );

      setContent('');

      if (newComment && typeof newComment === 'object') {
        onCommentAdded(newComment);
      }

      onCloseClick();
    } catch (sendError) {
      console.error('[COMMENT_CREATE_ERROR]', sendError);

      toast.showErrorToast(
        sendError?.message || 'خطا در ارتباط با سرور. دوباره تلاش کنید.'
      );
    } finally {
      setSendLoading(false);
    }
  };

  if (!user) {
    return (
      <SiteCard
        variant='yellow'
        padding='lg'
        radius='md'
        className='mb-7 text-center'
      >
        <div
          aria-hidden='true'
          className='bg-yellow/10 absolute -right-20 -top-20 h-52 w-52 rounded-full blur-[70px]'
        />

        <span className='bg-yellow/10 text-yellow relative mx-auto flex h-14 w-14 items-center justify-center rounded-[20px]'>
          <LuLogIn size={28} />
        </span>

        <h3 className='relative mt-4 text-base font-black text-text-light sm:text-lg dark:text-text-dark'>
          برای ثبت دیدگاه وارد حساب شوید
        </h3>

        <p className='relative mx-auto mt-2 max-w-lg text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
          پس از ورود می‌توانید تجربه، سؤال یا نظر خودتان را درباره این
          {isCourse ? ' دوره' : ' مقاله'}
          ثبت کنید.
        </p>

        <SiteButton
          type='button'
          variant='primary'
          size='lg'
          startIcon={LuLogIn}
          endIcon={HiOutlineArrowLeft}
          onClick={loginClickHandler}
          className='relative mt-5'
        >
          ورود یا ثبت‌نام
        </SiteButton>
      </SiteCard>
    );
  }

  const username = getUserDisplayName(user);

  const avatarSrc = getSafeImageSrc(user?.avatar);

  return (
    <SiteCard variant='secondary' padding='md' radius='md' className='mb-7'>
      <div
        aria-hidden='true'
        className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-secondary/10 blur-[70px]'
      />

      <div className='relative z-10'>
        {/* User */}
        <div className='flex items-center justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-3'>
            <Image
              src={avatarSrc}
              alt={`تصویر پروفایل ${username}`}
              width={88}
              height={88}
              className='h-11 w-11 shrink-0 rounded-[15px] border-2 border-surface-light object-cover shadow-sm sm:h-12 sm:w-12 dark:border-surface-dark'
            />

            <div className='min-w-0'>
              <p className='truncate text-sm font-black text-text-light dark:text-text-dark'>
                {username}
              </p>

              <div className='mt-1 flex items-center gap-1.5 text-[9px] font-bold text-secondary sm:text-[10px]'>
                <HiOutlineSparkles size={13} />

                <span>دیدگاه خودت را بنویس</span>
              </div>
            </div>
          </div>

          <SiteBadge
            icon={HiOutlineCheckBadge}
            variant='secondary'
            size='sm'
            className='hidden sm:inline-flex'
          >
            پس از بررسی منتشر می‌شود
          </SiteBadge>
        </div>

        {/* Textarea */}
        <div className='mt-5'>
          <label
            htmlFor={`comment-content-${referenceId}`}
            className='mb-2 block text-xs font-bold text-text-light dark:text-text-dark'
          >
            متن دیدگاه
          </label>

          <div className='relative'>
            <textarea
              id={`comment-content-${referenceId}`}
              value={content}
              rows={6}
              minLength={10}
              disabled={sendLoading}
              aria-invalid={content.length > 0 && !isContentValid}
              placeholder='تجربه، سؤال یا دیدگاه خودت را اینجا بنویس...'
              onChange={(event) => setContent(event.target.value)}
              className='min-h-[150px] w-full resize-y rounded-[22px] border border-black/5 bg-surface-light/75 px-4 py-4 text-sm leading-8 text-text-light outline-none transition-all duration-300 placeholder:text-subtext-light/60 focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-surface-dark/65 dark:text-text-dark dark:placeholder:text-subtext-dark/60'
            />

            <span className='pointer-events-none absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
              <HiOutlineChatBubbleLeftRight size={18} />
            </span>
          </div>

          <div className='mt-2 flex flex-wrap items-center justify-between gap-2'>
            <p
              className={`text-[10px] leading-5 ${
                content.length > 0 && !isContentValid
                  ? 'text-rose-500'
                  : 'text-subtext-light dark:text-subtext-dark'
              }`}
            >
              حداقل ۱۰ کاراکتر برای ثبت دیدگاه لازم است.
            </p>

            <span className='font-faNa text-[10px] text-subtext-light dark:text-subtext-dark'>
              {normalizedContent.length.toLocaleString('fa-IR')} کاراکتر
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className='mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
          <SiteButton
            type='button'
            variant='outline'
            size='lg'
            disabled={sendLoading}
            onClick={onCloseClick}
            className='w-full sm:w-auto'
          >
            لغو
          </SiteButton>

          <SiteButton
            type='button'
            variant='primary'
            size='lg'
            startIcon={HiOutlineChatBubbleLeftRight}
            endIcon={HiOutlineArrowLeft}
            loading={sendLoading}
            disabled={sendLoading || !isContentValid}
            onClick={sendCommentHandler}
            className='w-full sm:w-auto'
          >
            {sendLoading ? 'در حال ارسال...' : 'ارسال دیدگاه'}
          </SiteButton>
        </div>
      </div>
    </SiteCard>
  );
};

CreateCommentCard.propTypes = {
  user: PropTypes.object,

  referenceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,

  onCloseClick: PropTypes.func.isRequired,

  onCommentAdded: PropTypes.func.isRequired,

  isCourse: PropTypes.bool.isRequired,
};

export default CreateCommentCard;
