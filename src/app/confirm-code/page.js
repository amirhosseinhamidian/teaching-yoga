"use client"
import Logo from '@/components/Logo/Logo';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { useAuth } from '@/contexts/AuthContext';
import { countdown } from '@/utils/countdown';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaArrowRight } from "react-icons/fa6";


const LoginPage = () => {
  const {userPhone, token, setToken } = useAuth()
  const [confirmCode, setConfirmCode] = useState('')
  const [time, setTime] = useState('02:00');
  const [isFinished, setIsFinished] = useState(false);
  const router = useRouter();

  useEffect(() => {
    handleStartTimer();
  }, []);

  const handleStartTimer = async () => {
    setIsFinished(false);
    setTime('02:00')
    await countdown(120, (updatedTime) => {
      setTime(updatedTime); // Restart countdown and update time with each tick
    }).then((result) => {
      setTime(result.time);
      setIsFinished(result.isFinished);
    });
  };

  useEffect(() => {
    if (token === -1) {
      router.push('/login');
    }
  }, [token, router])

  const backwardHandle = () => {
    setToken(-1)
    router.back()
  }

  const loginHandle = () => {
    
  }

  return (
    <div className='flex h-svh items-center justify-center'>
      <div className='relative rounded-2xl bg-surface-light p-12 dark:bg-surface-dark'>
        <FaArrowRight onClick={backwardHandle} className='text-text-light dark:text-text-dark absolute text-xl top-20 md:cursor-pointer'/>
        <Logo size='large' className='justify-center' />
        <h3 className='mt-4 text-xl font-semibold text-text-light dark:text-text-dark'>
          ورود
        </h3>
        <p className='mt-3 text-xs text-text-light dark:text-text-dark'>
          کد تایید برای شماره <span className='font-faNa font-bold'>{userPhone}</span> ارسال شد
        </p>
        <Input
          value={confirmCode}
          onChange={setConfirmCode}
          fullWidth
          placeholder='کد تایید'
          focus
          type='number'
          className='text-lg mt-12 md:min-w-64'
        />

        {!isFinished ? (
          <p className='text-center mt-4 text-xs'>
            <span className='font-faNa text-base'>{time} </span> مانده تا دریافت کد مجدد
          </p>
        ) : (
          <p className='text-blue hover:underline text-center mt-4 text-sm md:cursor-pointer' onClick={handleStartTimer}>
            دریافت کد مجدد
          </p>
        )}

        <Button shadow onClick={loginHandle} className='mt-8 w-full'>
          تایید
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;
