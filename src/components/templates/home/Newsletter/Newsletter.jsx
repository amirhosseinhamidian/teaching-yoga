'use client';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import React, { useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const Newsletter = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmitNewsletterEmail = async () => {
    if (!email.trim()) {
      toast.showErrorToast('لطفا ایمیل خود را وارد کنید');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.showErrorToast('لطفا یک ایمیل معتبر وارد کنید');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast('ایمیل شما با موفقیت ثبت شد.');
        setEmail('');
      } else {
        toast.showErrorToast(data.message || 'خطایی رخ داده است.');
      }
    } catch (error) {
      toast.showLoadingToast('خطایی در ارسال درخواست رخ داده است.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div
      className='container mb-16 mt-4 sm:px-8 md:mb-24 md:mt-8 md:px-16 xl:px-56'
      data-aos='fade-up'
    >
      <div className='rounded-ee-[64px] rounded-ss-[64px] bg-surface-light p-6 text-center shadow dark:bg-surface-dark'>
        <h2 className='text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl'>
          خبردار شو
        </h2>
        <p className='mt-4 text-sm text-subtext-light sm:text-base dark:text-subtext-dark'>
          برای دریافت اخرین اطلاعات از دوره ها و اطلاعات جدید، ایمیل تون رو وارد
          کنید.
        </p>
        <div className='my-10 flex w-full flex-wrap items-center justify-center gap-4'>
          <Input
            value={email}
            onChange={setEmail}
            placeholder='ایمیل را وارد کنید'
            className='w-full'
            type='email'
          />
          <Button
            className='sm-px-2 flex items-center justify-center gap-1 px-8 text-sm sm:text-base'
            disable={isLoading}
            shadow
            onClick={handleSubmitNewsletterEmail}
          >
            ثبت
            {isLoading && (
              <AiOutlineLoading3Quarters className='animate-spin' />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
