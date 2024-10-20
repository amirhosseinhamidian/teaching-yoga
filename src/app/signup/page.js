"use client"
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import Link from 'next/link';
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const page = () => {
  const {username, setUsername} = useAuth();
  const {userPhone, setUserPhone} = useAuth();
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
          className='text-lg mt-8 md:min-w-64'
        />
        <Input
          value={userPhone}
          onChange={setUserPhone}
          fullWidth
          placeholder='شماره همراه'
          type='number'
          className='text-lg mt-6 md:min-w-64'
        />

        <Button shadow onClick={() => console.log(userPhone)} className='mt-8 w-full'>ثبت نام</Button>
        <p className='mt-6 text-2xs text-center text-subtext-light dark:text-subtext-dark'>ثبت نام شما به معنای پذیرش <Link href='/signup' className='text-primary hover:underline md:cursor-pointer'>قوانین و مقررات </Link>سمانه یوگا است</p>
      </div>
    </div>
  );
};

export default page;
