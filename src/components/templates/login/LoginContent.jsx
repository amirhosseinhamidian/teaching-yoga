/* eslint-disable no-undef */
'use client';
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckPhoneAction } from '@/app/actions/CheckPhoneAction';

const LoginContent = () => {
  const { userPhone, setUserPhone, setToken, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const inputRef = useRef(null);

  if (user) {
    router.back();
  }

  useEffect(() => {
    const handleResize = () => {
      const inputElement = inputRef.current;
      if (window.visualViewport && inputElement) {
        const { height } = window.visualViewport;
        const inputRect = inputElement.getBoundingClientRect();

        // اگر کیبورد باز شد و Input زیر کیبورد قرار گرفت
        if (inputRect.bottom > height) {
          window.scrollTo({
            top: inputRect.top + window.scrollY - 20, // اسکرول به بالای کیبورد
            behavior: 'smooth',
          });
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/send-otp`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: userPhone }),
          },
        );

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
        console.error(error);
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
          ref={inputRef}
          value={userPhone}
          onChange={setUserPhone}
          fullWidth
          placeholder='شماره همراه'
          focus
          onEnterPress={loginHandler}
          type='number'
          className='mt-12 text-lg md:min-w-64'
          maxLength={11}
        />

        <Button
          shadow
          onClick={loginHandler}
          className='mt-8 w-full'
          isLoading={isSubmitting}
        >
          ورود
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

export default LoginContent;
