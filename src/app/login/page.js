'use client';
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckPhoneAction } from '../actions/CheckPhoneAction';
import { useRouter } from 'next/navigation';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber';
import { ImSpinner2 } from 'react-icons/im';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const Login = () => {
  const { userPhone, setUserPhone, setToken, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  if (user) {
    router.back();
  }

  const loginHandler = async () => {
    setIsSubmitting(true);

    const validation = validatePhoneNumber(userPhone);
    if (!validation.isValid) {
      setIsSubmitting(false);
      toast.showErrorToast(validation.errorMessage);
      return;
    }

    const checkResponse = await CheckPhoneAction(userPhone);
    if (checkResponse) {
      try {
        const response = await fetch('/api/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: userPhone }),
        });

        const data = await response.json();
        if (data.success) {
          setToken(data.token);
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
      router.push('/signup');
    }

    setIsSubmitting(false);
  };

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='rounded-2xl bg-surface-light p-12 dark:bg-surface-dark'>
        <Logo size='large' className='justify-center' />
        <h3 className='mt-4 text-xl font-semibold text-text-light dark:text-text-dark'>
          ورود
        </h3>
        <p className='mt-3 text-xs text-text-light dark:text-text-dark'>
          سلام؛ لطفا شماره موبایل خود را وارد کنید
        </p>
        <Input
          value={userPhone}
          onChange={setUserPhone}
          fullWidth
          placeholder='شماره همراه'
          focus
          type='number'
          className='mt-12 text-lg md:min-w-64'
          maxLength={11}
        />

        <Button
          shadow
          onClick={loginHandler}
          className='mt-8 flex w-full items-center justify-center'
          disable={isSubmitting}
        >
          ورود
          {isSubmitting && <ImSpinner2 className='mr-2 animate-spin' />}
        </Button>
        <p className='mt-6 text-center text-sm'>
          حساب کاربری ندارید؟{' '}
          <Link
            href='/signup'
            className='text-primary hover:underline md:cursor-pointer'
          >
            ثبت نام کنید{' '}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
