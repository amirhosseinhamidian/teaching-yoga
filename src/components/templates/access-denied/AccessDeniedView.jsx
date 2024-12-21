'use client';
import React from 'react';
import Image from 'next/image';
import Button from '@/components/Ui/Button/Button';
import { useRouter } from 'next/navigation';

const AccessDeniedView = () => {
  const router = useRouter();
  return (
    <div className='container w-full'>
      <div className='mx-auto my-8 flex w-fit flex-col items-center justify-center gap-4 rounded-xl bg-surface-light px-12 md:my-12 md:px-20 dark:bg-surface-dark'>
        <Image
          src='/images/access-denied.png'
          alt='access denied'
          width={320}
          height={280}
        />
        <h1 className='text-lg font-semibold text-subtext-light sm:text-xl md:text-2xl lg:text-3xl dark:text-subtext-dark'>
          دسترسی غیر مجاز
        </h1>
        <h2 className='text-sm text-subtext-light sm:text-base md:text-lg dark:text-subtext-dark'>
          شما امکان دسترسی به این صفحه را ندارید.
        </h2>
        <Button className='mb-14' shadow onClick={() => router.back()}>
          بازگشت
        </Button>
      </div>
    </div>
  );
};

export default AccessDeniedView;
