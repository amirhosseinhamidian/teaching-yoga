/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

const SectionEditProfile = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const { user } = useAuthUser();
  const { loadUser } = useUserActions();

  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState(user?.username || '');
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');

  const [errorMessages, setErrorMessages] = useState({
    username: '',
    firstname: '',
    lastname: '',
  });

  const validateInputs = () => {
    let errors = {};

    if (!username.trim()) {
      errors.username = 'نام کاربری الزامی است.';
    }

    if (firstname.trim() && firstname.trim().length < 2) {
      errors.firstname = 'نام باید حداقل 2 کاراکتر باشد.';
    }

    if (lastname.trim() && lastname.trim().length < 3) {
      errors.lastname = 'نام خانوادگی باید حداقل 3 کاراکتر باشد.';
    }

    setErrorMessages(errors);

    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }

    const payload = { firstname, lastname, username };

    setIsLoading(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.showSuccessToast('اطلاعات با موفقیت ویرایش شد');

        // 🔥 بارگذاری مجدد اطلاعات جدید کاربر
        await loadUser();
      } else {
        if (data.field === 'username') {
          setErrorMessages({ username: data.error });
        }
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex w-full flex-col gap-4'>
      <Input
        label='نام'
        placeholder='نام را وارد کنید'
        value={firstname}
        onChange={setFirstname}
        errorMessage={errorMessages.firstname}
        maxLength={20}
        className='bg-surface-light text-text-light placeholder:text-xs sm:w-2/3 placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
      />

      <Input
        label='نام خانوادگی'
        placeholder='نام خانوادگی را وارد کنید'
        value={lastname}
        onChange={setLastname}
        errorMessage={errorMessages.lastname}
        maxLength={30}
        className='bg-surface-light text-text-light placeholder:text-xs sm:w-2/3 placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
      />

      <Input
        label='نام کاربری'
        placeholder='نام کاربری منحصر به فرد وارد کنید'
        value={username}
        onChange={setUsername}
        errorMessage={errorMessages.username}
        maxLength={25}
        className='bg-surface-light text-text-light placeholder:text-xs sm:w-2/3 placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
      />

      <Button
        onClick={handleFormSubmit}
        className='mt-8 text-xs sm:w-1/3 sm:text-sm'
        isLoading={isLoading}
      >
        ویرایش
      </Button>
    </div>
  );
};

export default SectionEditProfile;
