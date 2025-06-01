'use client';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import React, { useState } from 'react';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

const Newsletter = () => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');

  const handleSubmitNewsletterPhone = async () => {
    if (!phone.trim()) {
      toast.showErrorToast('لطفا شماره موبایل خود را وارد کنید');
      return;
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.showErrorToast('شماره موبایل باید با 09 شروع شود و 11 رقم باشد');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.showSuccessToast('شماره موبایل شما با موفقیت ثبت شد.');
        setPhone('');
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
    <div className='container mb-16 mt-10 sm:px-8 md:mb-24 md:mt-20 md:px-16 xl:px-56'>
      <motion.div
        className='relative overflow-hidden rounded-ee-[64px] rounded-ss-[64px] bg-surface-light p-6 text-center shadow dark:bg-surface-dark'
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 50, damping: 14 }}
      >
        {/* بک‌گراند سمت چپ */}
        <img
          src='/images/Mask Group.png'
          alt='left-bg'
          className='pointer-events-none absolute left-0 top-0 z-0 h-full object-contain'
        />

        {/* بک‌گراند سمت راست */}
        <img
          src='/images/Mask Group1.png'
          alt='right-bg'
          className='pointer-events-none absolute right-0 top-0 z-0 h-full object-contain'
        />

        {/* محتوای اصلی */}
        <div className='relative z-10'>
          <motion.h2
            className='font-fancy text-2xl sm:text-3xl lg:text-4xl xl:text-5xl'
            initial={{ scale: 0.95 }}
            animate={{ scale: 1.1 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
          >
            خبردار شو
          </motion.h2>

          <p className='mt-4 text-sm text-subtext-light sm:text-base dark:text-subtext-dark'>
            برای دریافت آخرین اخبار دوره‌ها و اطلاعات جدید، شماره موبایل‌تون رو
            وارد کنید.
          </p>

          <div className='my-10 flex w-full flex-wrap items-center justify-center gap-4'>
            <Input
              value={phone}
              onChange={setPhone}
              placeholder='شماره موبایل را وارد کنید'
              className='w-full'
              maxLength={11}
              type='number'
            />
            <Button
              className='sm-px-2 px-8 text-sm transition-transform duration-300 hover:scale-105 sm:text-base'
              isLoading={isLoading}
              shadow
              onClick={handleSubmitNewsletterPhone}
            >
              ثبت
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Newsletter;
