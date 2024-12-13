'use client';
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ImSpinner2 } from 'react-icons/im';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const Page = () => {
  const { username, setUsername, user } = useAuth();
  const { userPhone, setUserPhone } = useAuth();
  const { setToken } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  if (user) {
    router.back();
  }

  const signupHandle = async () => {
    if (!username || !userPhone) {
      toast.showErrorToast('لطفاً نام کاربری و شماره موبایل خود را وارد کنید.');
      return;
    }

    setIsSubmitting(true);

    // validation for correct phone number, unique phone number and username
    const response = await fetch('/api/signup-validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        userPhone,
      }),
    });

    const data = await response.json();

    if (data.success) {
      try {
        const result = await fetch('/api/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: userPhone }),
        });

        const data = await result.json();
        if (data.success) {
          setToken(result.token);
          router.push('/confirm-code');
        } else {
          if (data.error) {
            toast.showErrorToast(data.error); // Show the error message from the API
          } else {
            toast.showErrorToast('ارسال کد ناموفق بود، لطفاً دوباره تلاش کنید');
          }
        }
      } catch (error) {
        toast.showErrorToast('خطا در ارتباط با سرور. لطفاً بعداً تلاش کنید');
      }
    } else {
      toast.showErrorToast('خطا در ثبت نام. لطفاً دوباره تلاش کنید.');
    }

    setIsSubmitting(false);
  };
  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='rounded-2xl bg-surface-light p-12 dark:bg-surface-dark'>
        <Logo size='large' className='justify-center' />
        <h3 className='mt-4 text-xl font-semibold text-text-light dark:text-text-dark'>
          ثبت نام
        </h3>
        <p className='mt-3 text-xs text-text-light dark:text-text-dark'>
          لطفا یک نام کاربری و شماره موبایل خود را وارد کنید
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
          value={userPhone}
          onChange={setUserPhone}
          fullWidth
          placeholder='شماره همراه'
          type='number'
          className='mt-6 text-lg md:min-w-64'
        />

        <Button
          shadow
          onClick={signupHandle}
          className='mt-8 flex w-full items-center justify-center'
          disable={isSubmitting}
        >
          ثبت نام
          {isSubmitting && <ImSpinner2 className='mr-2 animate-spin' />}
        </Button>
        <p className='mt-6 text-center text-2xs text-subtext-light dark:text-subtext-dark'>
          ثبت نام شما به معنای پذیرش{' '}
          <Link
            href='/signup'
            className='text-primary hover:underline md:cursor-pointer'
          >
            قوانین و مقررات{' '}
          </Link>
          سمانه یوگا است
        </p>
      </div>
    </div>
  );
};

export default Page;
