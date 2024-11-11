'use client';
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { useAuth } from '@/contexts/AuthContext';
import { countdown } from '@/utils/countdown';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import { ImSpinner2 } from 'react-icons/im';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const ConfirmCodePage = () => {
  const { userPhone, username, token, setToken, setUser } = useAuth();
  const [confirmCode, setConfirmCode] = useState('');
  const [time, setTime] = useState('02:00');
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTryAgin, setShowTryAgin] = useState(false);
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  useEffect(() => {
    handleStartTimer();
  }, []);

  const handleStartTimer = async () => {
    setIsFinished(false);
    setTime('02:00');
    await countdown(120, (updatedTime) => {
      setTime(updatedTime); // Restart countdown and update time with each tick
      if (updatedTime === '00:01') {
        setShowTryAgin(true);
      }
    }).then((result) => {
      setTime(result.time);
      setIsFinished(result.isFinished);
    });
  };

  useEffect(() => {
    if (token === -1 && !showTryAgin) {
      router.replace('/login');
    }
  }, [token, router]);

  const backwardHandle = () => {
    setToken(-1);
    router.back();
  };

  const loginHandle = async () => {
    if (!confirmCode) {
      toast.showErrorToast('لطفاً کد تایید را وارد کنید.');
      return;
    }

    if (confirmCode.length !== 5) {
      toast.showErrorToast('لطفاً کد تایید را به طور کامل وارد کنید.');
      return;
    }

    setIsSubmitting(true);

    const response = await fetch('/api/verify-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: userPhone,
        code: confirmCode,
      }),
    });

    const data = await response.json();
    if (data.success) {
      if (username) {
        const signupRes = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            userPhone,
          }),
        });

        const data = await signupRes.json();

        if (data.success) {
          toast.showSuccessToast('ثبت نام با موفقیت انجام شد');
        } else {
          toast.showErrorToast('خطا در ثبت نام.');
        }
      }

      const result = await signIn('credentials', {
        redirect: false,
        phone: userPhone,
        code: confirmCode,
      });

      if (result?.ok) {
        const userRes = await fetch('/api/get-me');
        const user = await userRes.json();
        toast.showSuccessToast('با موفقیت وارد شدید');
        setUser(user);
        const previousPage = sessionStorage.getItem('previousPage');
        sessionStorage.removeItem('previousPage');
        router.replace(previousPage);
      } else {
        toast.showErrorToast('کد تایید نادرست است.');
      }
    } else {
      toast.showErrorToast('کد تأیید نامعتبر است. لطفاً دوباره امتحان کنید.');
    }

    setIsSubmitting(false);
  };

  const tryAgainHandle = async () => {
    try {
      handleStartTimer();
      setShowTryAgin(false);
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
  };

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='relative rounded-2xl bg-surface-light p-12 dark:bg-surface-dark'>
        <FaArrowRight
          onClick={backwardHandle}
          className='absolute top-20 text-xl text-text-light md:cursor-pointer dark:text-text-dark'
        />
        <Logo size='large' className='justify-center' />
        <h3 className='mt-4 text-xl font-semibold text-text-light dark:text-text-dark'>
          ورود
        </h3>
        <p className='mt-3 text-xs text-text-light dark:text-text-dark'>
          کد تایید برای شماره{' '}
          <span className='font-faNa font-bold'>{userPhone}</span> ارسال شد
        </p>
        <Input
          value={confirmCode}
          onChange={setConfirmCode}
          fullWidth
          placeholder='کد تایید'
          focus
          type='number'
          className='mt-12 text-lg md:min-w-64'
          maxLength={5}
        />

        {!isFinished ? (
          <p className='mt-4 text-center text-xs'>
            <span className='font-faNa text-base'>{time} </span> مانده تا دریافت
            مجدد کد
          </p>
        ) : (
          <p
            className='mt-4 text-center text-sm text-blue hover:underline md:cursor-pointer'
            onClick={tryAgainHandle}
          >
            دریافت مجدد کد
          </p>
        )}

        <Button
          shadow
          onClick={loginHandle}
          className='mt-8 flex w-full items-center justify-center'
          disable={isSubmitting}
        >
          تایید
          {isSubmitting && <ImSpinner2 className='mr-2 animate-spin' />}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmCodePage;
