/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';

import Input from '@/components/Ui/Input/Input';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

import {
  HiOutlineIdentification,
  HiOutlinePencilSquare,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

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
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]'>
      <SiteCard
        variant='glass'
        padding='none'
        radius='lg'
        topLine
        className='p-4 sm:p-5 lg:p-6'
      >
        <div className='mb-5 flex items-center gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
          <span className='flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlinePencilSquare size={22} />
          </span>

          <div>
            <p className='text-[10px] font-bold text-secondary'>اطلاعات شخصی</p>
            <h3 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              ویرایش مشخصات حساب
            </h3>
          </div>
        </div>

        <div className='grid gap-4 sm:grid-cols-2'>
          <Input
            label='نام'
            placeholder='نام را وارد کنید'
            value={firstname}
            onChange={setFirstname}
            errorMessage={errorMessages.firstname}
            maxLength={20}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />

          <Input
            label='نام خانوادگی'
            placeholder='نام خانوادگی را وارد کنید'
            value={lastname}
            onChange={setLastname}
            errorMessage={errorMessages.lastname}
            maxLength={30}
            className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
          />

          <div className='sm:col-span-2'>
            <Input
              label='نام کاربری'
              placeholder='نام کاربری منحصر به فرد وارد کنید'
              value={username}
              onChange={setUsername}
              errorMessage={errorMessages.username}
              maxLength={25}
              fullWidth
              className='bg-surface-light text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
            />
          </div>
        </div>

        <div className='mt-6 flex justify-end'>
          <SiteButton
            type='button'
            variant='primary'
            size='md'
            disabled={isLoading}
            onClick={handleFormSubmit}
          >
            {isLoading ? (
              <span className='flex items-center gap-2'>
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                در حال ذخیره...
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                <HiOutlinePencilSquare size={17} />
                ذخیره تغییرات
              </span>
            )}
          </SiteButton>
        </div>
      </SiteCard>

      <div className='space-y-3'>
        <SiteCard
          variant='glass'
          padding='none'
          radius='md'
          className='p-4'
        >
          <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineIdentification size={21} />
          </span>
          <h4 className='mt-3 text-xs font-black text-text-light dark:text-text-dark'>
            اطلاعات حساب
          </h4>
          <p className='mt-1.5 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
            نام و نام خانوادگی اختیاری هستند، اما نام کاربری برای حساب شما الزامی
            است.
          </p>
        </SiteCard>

        <SiteCard
          variant='glass'
          padding='none'
          radius='md'
          className='p-4'
        >
          <span className='flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow/10 text-yellow'>
            <HiOutlineShieldCheck size={21} />
          </span>
          <h4 className='mt-3 text-xs font-black text-text-light dark:text-text-dark'>
            امنیت اطلاعات
          </h4>
          <p className='mt-1.5 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
            تغییرات این فرم فقط روی اطلاعات عمومی پروفایل شما اعمال می‌شود.
          </p>
        </SiteCard>
      </div>
    </div>
  );
};

export default SectionEditProfile;
