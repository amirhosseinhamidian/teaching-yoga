'use client';

import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { useUserForm } from '@/hooks/auth/useUserForm';
import { useUserActions } from '@/hooks/auth/useUserActions';
import { useCartActions } from '@/hooks/cart/useCartActions';
import { countdown } from '@/utils/countdown';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const ConfirmCodeContent = () => {
  const router = useRouter();

  // وضعیت کاربر (اگر لاگین بود ریدایرکت می‌کنیم)
  const { user } = useAuthUser();

  // state های موقت فرم
  const { phone, username, otpToken, setOtpToken, clearForm } = useUserForm();

  // اکشن های Redux
  const { verifyOtp, signupUser, loginOtp, loadUser } = useUserActions();
  const { fetchCart } = useCartActions();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [confirmCode, setConfirmCode] = useState('');
  const [time, setTime] = useState('02:00');
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلوگیری از ورود مستقیم بدون otpToken
  useEffect(() => {
    // hydration check
    console.log('token in confirm code page ========> ', otpToken);
    if (otpToken === undefined) return;

    if (user) {
      router.replace('/');
      return;
    }

    if (!otpToken) {
      router.replace('/login');
      return;
    }

    startTimer();
  }, [otpToken, user]);

  // برگشت
  const backwardHandle = () => {
    clearForm();
    router.back();
  };

  // تایمر
  const startTimer = async () => {
    setIsFinished(false);
    setTime('02:00');

    await countdown(120, (t) => setTime(t)).then((res) => {
      setTime(res.time);
      setIsFinished(res.isFinished);
    });
  };

  // ارسال OTP دوباره
  const tryAgainHandle = async () => {
    startTimer();

    const req = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await req.json();

    if (!data.success) {
      toast.showErrorToast(data.error || 'ارسال مجدد کد ناموفق بود.');
      return;
    }

    setOtpToken(data.token);
  };

  // مرحله اصلی ورود
  const loginHandle = async () => {
    if (confirmCode.length !== 5) {
      toast.showErrorToast('کد تایید باید ۵ رقمی باشد.');
      return;
    }

    setIsSubmitting(true);

    try {
      // -----------------------
      // 1) Verify OTP
      // -----------------------
      const verify = await verifyOtp({ phone, code: confirmCode });

      if (verify.meta.requestStatus !== 'fulfilled') {
        toast.showErrorToast('کد تایید نادرست است.');
        setIsSubmitting(false);
        return;
      }

      // -----------------------
      // 2) Signup (اگر username وجود داشت یعنی کاربر جدید است)
      // -----------------------
      if (username) {
        const sign = await signupUser({ username, phone });

        if (sign.meta.requestStatus !== 'fulfilled') {
          toast.showErrorToast('ثبت نام ناموفق بود.');
          setIsSubmitting(false);
          return;
        }

        toast.showSuccessToast('ثبت نام موفقیت‌آمیز بود');
      }

      // -----------------------
      // 3) Login OTP → سرور کوکی ایجاد می‌کند
      // -----------------------
      const login = await loginOtp({ phone });

      if (login.meta.requestStatus !== 'fulfilled') {
        toast.showErrorToast('ورود ناموفق بود.');
        setIsSubmitting(false);
        return;
      }

      // -----------------------
      // 4) Load full user profile
      // -----------------------
      await loadUser();

      // 5) Load cart from server
      await fetchCart();

      toast.showSuccessToast('با موفقیت وارد شدید');

      const previousPage = sessionStorage.getItem('previousPage') || '/';
      sessionStorage.removeItem('previousPage');

      clearForm();
      router.replace(previousPage);
    } catch (err) {
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

        <h3 className='mt-4 text-xl font-semibold'>تایید کد</h3>

        <p className='mt-3 text-xs'>
          کد تأیید برای شماره
          <span className='font-faNa font-bold'> {phone} </span>
          ارسال شد
        </p>

        <Input
          value={confirmCode}
          onChange={setConfirmCode}
          fullWidth
          placeholder='کد تایید'
          type='number'
          maxLength={5}
          onEnterPress={loginHandle}
          className='mt-12 text-lg md:min-w-64'
        />

        {!isFinished ? (
          <p className='mt-4 text-center text-xs'>
            <span className='font-faNa text-base'>{time}</span> مانده تا دریافت
            دوباره کد
          </p>
        ) : (
          <p
            className='mt-4 cursor-pointer text-center text-sm text-blue hover:underline'
            onClick={tryAgainHandle}
          >
            دریافت مجدد کد
          </p>
        )}

        <Button
          shadow
          onClick={loginHandle}
          className='mt-8 w-full'
          isLoading={isSubmitting}
        >
          تایید
        </Button>
      </div>
    </div>
  );
};

export default ConfirmCodeContent;
