'use client';
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { validatePhoneNumber } from '@/utils/validatePhoneNumber';
import { ImSpinner2 } from 'react-icons/im';
import { CheckPhoneAction } from '@/app/actions/CheckPhoneAction';
import { OTP } from '@/app/actions/Sms';

export default function LoginForm() {
  const { userPhone, setUserPhone } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginHandler = async () => {
    setIsSubmitting(true);
    const validation = validatePhoneNumber(userPhone);
    if (!validation.isValid) {
      console.log(validation.errorMessage);
      //TODO:Add toast error
      return;
    }
    const checkResponse = await CheckPhoneAction(userPhone);
    if (checkResponse) {
      try {
        console.log(userPhone);
        const result = await OTP(userPhone);
        if (result.success) {
          console.log('Generated OTP token:', result.token);
          router.push('/confirm-code');
        }
      } catch (error) {
        console.error('Error during OTP request:', error);
        // TODO: نمایش Toast برای خطا
      }
    } else {
      router.push('/signup');
    }
    setIsSubmitting(false);
  };
  return (
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
      />

      <Button
        shadow
        onClick={() => loginHandler()}
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
  );
}
