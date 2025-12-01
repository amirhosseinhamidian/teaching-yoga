'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

const UserInformationCard = ({ className }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const { user } = useAuthUser();
  const { loadUser } = useUserActions();

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessages, setErrorMessages] = useState({
    firstname: '',
    lastname: '',
    email: '',
  });

  // ✔ فرم را بعد از لود شدن user آپدیت کن
  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || '');
      setLastname(user.lastname || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const validateInputs = () => {
    let errors = {};

    if (!firstname.trim()) {
      errors.firstname = 'لطفا نام خود را وارد کنید';
    } else if (firstname.length < 2) {
      errors.firstname = 'نام حداقل باید دو کاراکتر باشد';
    }

    if (!lastname.trim()) {
      errors.lastname = 'لطفا نام خانوادگی خود را وارد کنید';
    } else if (lastname.length < 3) {
      errors.lastname = 'نام خانوادگی حداقل باید سه کاراکتر باشد';
    }

    if (!phone.trim()) {
      errors.phone = 'لطفاً شماره موبایل خود را وارد کنید';
    } else if (!/^09\d{9}$/.test(phone)) {
      errors.phone = 'شماره موبایل معتبر نیست';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email)) {
      errors.email = 'یک ایمیل معتبر وارد کنید';
    }

    setErrorMessages(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmitUserInfo = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('لطفاً ورودی‌ها را به درستی تکمیل کنید');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        firstname,
        lastname,
        email,
        phone,
        username: user.username,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.showSuccessToast('اطلاعات با موفقیت به‌روزرسانی شد');

        // ✔ بعد از ذخیره، کاربر را دوباره از سرور بگیر
        loadUser();
      } else {
        toast.showErrorToast(data.error || 'خطایی رخ داده است');
      }
    } catch (err) {
      console.error(err);
      toast.showErrorToast('خطای غیرمنتظره رخ داد');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className='rounded-xl bg-surface-light p-4 shadow dark:bg-surface-dark'>
        <p>در حال بارگذاری اطلاعات کاربر...</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl bg-surface-light p-4 shadow sm:p-6 dark:bg-surface-dark ${className}`}
    >
      <h2 className='mb-2 text-lg font-semibold md:text-xl'>تکمیل اطلاعات</h2>

      <div className='flex w-full flex-col gap-4 xl:w-2/3'>
        <Input
          value={firstname}
          onChange={setFirstname}
          placeholder='نام'
          label='نام'
          maxLength={25}
          errorMessage={errorMessages.firstname}
        />

        <Input
          value={lastname}
          onChange={setLastname}
          placeholder='نام خانوادگی'
          label='نام خانوادگی'
          maxLength={30}
          errorMessage={errorMessages.lastname}
        />

        <Input
          value={phone}
          onChange={setPhone}
          placeholder='شماره موبایل'
          label='شماره موبایل'
          maxLength={11}
          errorMessage={errorMessages.phone}
          required
        />

        <Input
          value={email}
          onChange={setEmail}
          placeholder='ایمیل (اختیاری)'
          label='ایمیل'
          type='email'
          maxLength={50}
          errorMessage={errorMessages.email}
        />
      </div>

      <Button
        shadow
        isLoading={isLoading}
        onClick={handleSubmitUserInfo}
        className='mt-6 w-fit px-6 text-xs sm:text-sm'
      >
        ثبت
      </Button>
    </div>
  );
};

UserInformationCard.propTypes = {
  className: PropTypes.string,
};

export default UserInformationCard;
