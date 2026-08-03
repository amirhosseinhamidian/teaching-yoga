'use client';

import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useRouter } from 'next/navigation';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckPhoneAction } from '@/app/actions/CheckPhoneAction';
import GoogleLoginButton from '@/components/Ui/GoogleLoginButton/GoogleLoginButton';
import { useUserForm } from '@/hooks/auth/useUserForm';

const LoginContent = () => {
  const router = useRouter();
  const inputRef = useRef(null);

  // 🔹 وضعیت واقعی کاربر از Redux
  const { user } = useAuthUser();

  // 🔹 state های موقت فرم از useUserForm
  const { phone, setPhone, setOtpToken } = useUserForm();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلوگیری از ورود کاربر لاگین شده
  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  // Behavior: جابجایی input هنگام باز شدن کیبورد موبایل
  useEffect(() => {
    const handler = () => {
      const el = inputRef.current;
      if (!window.visualViewport || !el) return;

      const { height } = window.visualViewport;
      const rect = el.getBoundingClientRect();

      if (rect.bottom > height) {
        window.scrollTo({
          top: rect.top + window.scrollY - 20,
          behavior: 'smooth',
        });
      }
    };

    window.visualViewport?.addEventListener('resize', handler);
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, []);

  // -----------------------
  // Login Handler
  // -----------------------
  const loginHandler = async () => {
    setIsSubmitting(true);

    // 1) validate phone
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      toast.showErrorToast(validation.errorMessage);
      setIsSubmitting(false);
      return;
    }

    // 2) check if user exists
    const check = await CheckPhoneAction(phone);

    if (!check) {
      router.push('/signup');
      setIsSubmitting(false);
      return;
    }

    // 3) send OTP
    try {
      const req = await fetch(`/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await req.json();

      if (data.success) {
        setOtpToken(data.challengeId);
        router.push('/confirm-code');
      } else {
        toast.showErrorToast(data.error || 'ارسال کد ناموفق بود.');
      }
    } catch (err) {
      toast.showErrorToast('خطا در ارتباط با سرور.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='rounded-2xl bg-surface-light px-12 py-8 dark:bg-surface-dark'>
        <Logo size='large' className='justify-center' />

        <h3 className='mt-4 text-xl font-semibold'>ورود</h3>
        <p className='mt-3 text-xs'>سلام؛ لطفا شماره موبایل خود را وارد کنید</p>

        <Input
          ref={inputRef}
          value={phone}
          onChange={setPhone}
          fullWidth
          placeholder='شماره همراه'
          focus
          onEnterPress={loginHandler}
          type='tel'
          maxLength={20}
          className='mt-6 text-lg md:min-w-56'
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
          <Link href='/signup' className='text-primary hover:underline'>
            ثبت نام کنید
          </Link>
        </p>
        <hr className='my-3' />
        <GoogleLoginButton />
      </div>
    </div>
  );
};

export default LoginContent;
