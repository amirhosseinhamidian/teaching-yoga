/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import { useAuth } from '@/contexts/AuthContext';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const SectionEditProfile = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user, setUser } = useAuth();
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

    // Validation for username (required)
    if (!username || username.trim() === '') {
      errors.username = 'نام کاربری الزامی است.';
    }

    // Validation for firstname (optional, minimum 2 characters)
    if (firstname && firstname.trim() !== '') {
      if (firstname.trim().length < 2) {
        errors.firstname = 'نام باید حداقل 2 کاراکتر باشد.';
      }
    }

    // Validation for lastname (optional, minimum 3 characters)
    if (lastname && lastname.trim() !== '') {
      if (lastname.trim().length < 3) {
        errors.lastname = 'نام خانوادگی باید حداقل 3 کاراکتر باشد.';
      }

      // Set errors state
      setErrorMessages(errors);

      // Return true if no errors exist
      return Object.keys(errors).length === 0;
    }
  };

  const handleFormSubmit = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }

    const payload = {
      firstname,
      lastname,
      username,
    };

    setIsLoading(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        toast.showSuccessToast('اطلاعات با موفقیت ویرایش شد');
        setUser(updatedUser);
      } else {
        const errorData = await response.json();
        if (errorData.field) {
          toast.showErrorToast(`${errorData.error}`);
          if (errorData.field === 'username') {
            setErrorMessages({ username: errorData.error });
          }
        } else {
          // پیام پیش‌فرض در صورت نبودن جزئیات
          toast.showErrorToast('خطایی رخ داده است');
        }
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
        placeholder='  نام خانوادگی را وارد کنید'
        value={lastname}
        onChange={setLastname}
        errorMessage={errorMessages.lastname}
        thousandSeparator={true}
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
        className='mt-8 flex items-center justify-center text-xs sm:w-1/3 sm:text-base'
        disable={isLoading}
      >
        ویرایش
        {isLoading && (
          <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
        )}
      </Button>
    </div>
  );
};

SectionEditProfile.propTypes = {};

export default SectionEditProfile;
