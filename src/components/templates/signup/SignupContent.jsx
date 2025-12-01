'use client';

import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

import { useAuthUser } from '@/hooks/auth/useAuthUser';

import { useRouter } from 'next/navigation';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { FaArrowRight } from 'react-icons/fa6';
import { useUserForm } from '@/hooks/auth/useUserForm';
import { useUserActions } from '@/hooks/auth/useUserActions';

const SignupContent = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // وضعیت واقعی کاربر
  const { user } = useAuthUser();

  // وضعیت فرم
  const { username, setUsername, phone, setPhone, setOtpToken } = useUserForm();

  // اکشن‌ها
  const { sendOtp } = useUserActions();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // اگر لاگین بود، اجازه ورود به Signup نده
  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const backwardHandle = () => router.back();

  const signupHandle = async () => {
    if (!username || !phone) {
      toast.showErrorToast('لطفاً نام کاربری و شماره موبایل را وارد کنید.');
      return;
    }

    setIsSubmitting(true);

    try {
      // -------------------------
      // 1) اعتبارسنجی نام کاربری + موبایل
      // -------------------------
      const validationReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/signup-validation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, phone }),
        }
      );

      const validation = await validationReq.json();

      if (!validation.success) {
        toast.showErrorToast(validation.error || 'خطا در ثبت نام');
        setIsSubmitting(false);
        return;
      }

      // -------------------------
      // 2) ارسال OTP با Redux Thunk
      // -------------------------
      const result = await sendOtp(phone);

      if (result.meta.requestStatus === 'fulfilled') {
        // ذخیره token
        setOtpToken(result.payload.token);

        router.push('/confirm-code');
      } else {
        toast.showErrorToast(result.payload || 'ارسال کد ناموفق بود.');
      }
    } catch (error) {
      toast.showErrorToast('خطا در ارتباط با سرور.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='relative rounded-2xl bg-surface-light p-12 dark:bg-surface-dark'>
        <FaArrowRight
          onClick={backwardHandle}
          className='absolute top-20 text-xl text-text-light dark:text-text-dark'
        />

        <Logo size='large' className='justify-center' />

        <h3 className='mt-4 text-xl font-semibold text-text-light dark:text-text-dark'>
          ثبت نام
        </h3>

        <p className='mt-3 text-xs text-text-light dark:text-text-dark'>
          لطفاً نام کاربری و شماره موبایل خود را وارد کنید
        </p>

        <Input
          value={username}
          onChange={setUsername}
          fullWidth
          placeholder='نام کاربری'
          focus
          className='mt-8 text-lg md:min-w-64'
        />

        <Input
          value={phone}
          onChange={setPhone}
          fullWidth
          placeholder='شماره همراه'
          onEnterPress={signupHandle}
          type='tel'
          maxLength={20}
          className='mt-6 text-right text-lg md:min-w-64'
        />

        <Button
          shadow
          onClick={signupHandle}
          className='mt-8 w-full'
          isLoading={isSubmitting}
        >
          ثبت نام
        </Button>

        <p className='mt-6 text-center text-2xs text-subtext-light dark:text-subtext-dark'>
          ثبت نام شما به معنای پذیرش{' '}
          <Link href='/rules' className='text-primary hover:underline'>
            قوانین و مقررات
          </Link>{' '}
          سمانه یوگا است
        </p>
      </div>
    </div>
  );
};

export default SignupContent;
