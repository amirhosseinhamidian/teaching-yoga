/* eslint-disable no-undef */
'use client';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const UserInformationCard = ({ className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuth();
  const [firstname, setFirstname] = useState(user?.firstname || '');
  const [lastname, setLastname] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);

  const [errorMessages, setErrorMessages] = useState({
    firstname: '',
    lastname: '',
    email: '',
  });

  const validateInputs = () => {
    let errors = {};

    // Validate firstname
    if (!firstname.trim()) {
      errors.firstname = 'لطفا نام خود را وارد کنید';
    } else if (firstname.length < 2) {
      errors.firstname = 'نام حداقل باید دو کاراکتر باشد';
    }

    // Validate lastname
    if (!lastname.trim()) {
      errors.lastname = 'لطفا نام خانوادگی خود را وارد کنید';
    } else if (lastname.length < 3) {
      errors.lastname = 'نام خانوادگی حداقل باید سه کاراکتر باشد';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email)) {
      errors.email = 'لطفا یک ایمیل معتبر وارد کنید';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleSubmitUserInfo = async () => {
    if (validateInputs()) {
      const payload = {
        firstname,
        lastname,
        email,
        username: user.username,
      };
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
        );
        if (response.ok) {
          toast.showSuccessToast('اطلاعات با موفقیت ویرایش شد');
        } else {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            },
          );
          if (response.ok) {
            toast.showSuccessToast('اطلاعات با موفقیت ثبت شد');
          } else {
            toast.showErrorToast('خطایی رخ داده است');
          }
        }
      } catch (error) {
        toast.showErrorToast('خطای غیرمنتظره');
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-surface-light p-4 shadow sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-2 text-lg font-semibold md:text-xl'>تکمیل اطلاعات</h2>
      <div className='flex w-full flex-col gap-4 xl:w-2/3'>
        <Input
          value={firstname}
          onChange={setFirstname}
          placeholder='نام خود را وارد کنید'
          label='نام'
          maxLength={25}
          errorMessage={errorMessages.firstname}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          value={lastname}
          onChange={setLastname}
          errorMessage={errorMessages.lastname}
          placeholder='نام خانوادگی خود را وارد کنید'
          label='نام خانوادگی'
          maxLength={30}
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
        <Input
          value={email}
          onChange={setEmail}
          errorMessage={errorMessages.email}
          placeholder='ایمیل خود را وارد کنید (اختیاری)'
          label='ایمیل'
          type='email'
          className='bg-surface-light text-xs sm:text-sm dark:bg-surface-dark'
        />
      </div>
      <Button
        shadow
        disable={isLoading}
        onClick={handleSubmitUserInfo}
        className='mt-6 flex w-fit items-center justify-center gap-2 px-6 text-xs sm:text-sm'
      >
        ثبت
        {isLoading && <AiOutlineLoading3Quarters className='animate-spin' />}
      </Button>
    </div>
  );
};

UserInformationCard.propTypes = {
  className: PropTypes.string,
};

export default UserInformationCard;
