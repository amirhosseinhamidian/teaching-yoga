/* eslint-disable no-undef */
'use client';
import React, { useRef, useState } from 'react';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import { MdOutlineAddAPhoto } from 'react-icons/md';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import Image from 'next/image';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

const ProfileHead = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuthUser();
  const { loadUser } = useUserActions();
  const [loadingUpload, setLoadingUpload] = useState(false);

  const fileInputRef = useRef(null);

  const handleDivClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    setLoadingUpload(true);
    const file = event.target.files[0];
    if (file) {
      // شروع فرآیند آپلود
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', 'images/avatars');
      formData.append('fileName', user.id);

      try {
        // آپلود فایل (جایگزین کنید با API خودتان)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/image`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const avatarUrl = await response.json();
          const updateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}/update-avatar`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                avatar: avatarUrl.fileUrl,
              }),
            }
          );
          if (updateResponse.ok) {
            await loadUser();
            toast.showSuccessToast('آواتار با موفقیت آپلود شد');
          } else {
            toast.showErrorToast.error('خطا در آپلود تصویر');
          }
        } else {
          toast.showErrorToast.error('خطا در آپلود تصویر');
        }
      } catch (error) {
        toast.showErrorToast('خطا در آپلود:', error);
        console.error('avatar upload error: ', error);
      } finally {
        setLoadingUpload(false);
      }
    }
  };
  return (
    <div>
      <PageTitle>حساب کاربری</PageTitle>
      <div className='flex items-center gap-2'>
        <input
          type='file'
          ref={fileInputRef}
          className='hidden'
          accept='image/*'
          onChange={handleFileChange}
        />
        {user?.avatar ? (
          <div className='relative md:cursor-pointer' onClick={handleDivClick}>
            <Image
              src={user?.avatar}
              alt={user.username}
              width={256}
              height={256}
              className={`h-14 w-14 rounded-full border border-secondary xs:h-16 xs:w-16 sm:h-20 sm:w-20 ${loadingUpload ? 'opacity-50' : ''}`}
            />
            <div
              className={`absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black bg-opacity-55 p-1.5 ${loadingUpload ? 'opacity-50' : ''}`}
              onClick={handleDivClick}
            >
              <MdOutlineAddAPhoto size={16} className='text-secondary' />
            </div>

            {loadingUpload && (
              <AiOutlineLoading3Quarters
                size={34}
                className='absolute left-2.5 top-2.5 animate-spin text-secondary xs:left-4 xs:top-4 sm:left-6 sm:top-6'
              />
            )}
          </div>
        ) : (
          <div
            className='flex h-14 w-14 items-center justify-center rounded-full border border-secondary bg-surface-light p-2 xs:h-16 xs:w-16 sm:h-20 sm:w-20 md:cursor-pointer dark:bg-surface-dark'
            onClick={handleDivClick}
          >
            {loadingUpload ? (
              <AiOutlineLoading3Quarters
                size={34}
                className='animate-spin text-secondary'
              />
            ) : (
              <MdOutlineAddAPhoto size={34} className='text-secondary' />
            )}
          </div>
        )}
        <div className='flex flex-col gap-2'>
          <span className='text-sm font-semibold xs:text-lg'>
            {user?.firstname && user?.lastname
              ? `${user.firstname} ${user.lastname}`
              : user?.username}
          </span>
          <span className='font-faNa text-2xs text-subtext-light xs:text-sm dark:text-subtext-dark'>
            {`تاریخ عضویت: ${getShamsiDate(user?.createAt)}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHead;
