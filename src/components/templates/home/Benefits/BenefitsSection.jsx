'use client';
import React from 'react';
import { FaWalking } from 'react-icons/fa';
import { RiUserHeartLine } from 'react-icons/ri';
import { LuBrain } from 'react-icons/lu';
import BenefitsCard from './BenefitsCard';

const BenefitsSection = () => {
  const benefits = [
    {
      id: 1,
      title: 'انعطاف‌پذیری',
      description:
        'یوگا با حرکات کششی منظم، به تقویت عضلات و افزایش انعطاف‌پذیری بدن کمک می‌کند.',
      icon: (
        <FaWalking
          size={46}
          className='text-accent transition-colors duration-300 ease-in group-hover:text-background-light group-hover:dark:text-text-light'
        />
      ),
      animation: 'fade-right',
    },
    {
      id: 2,
      title: 'سلامت روان',
      description:
        'مدیتیشن و تمرینات تنفسی، استرس و اضطراب را کاهش داده و به بهبود تمرکز و تعادل روانی کمک می‌کند.',
      icon: (
        <LuBrain
          size={46}
          className='text-accent transition-colors duration-300 ease-in group-hover:text-background-light group-hover:dark:text-text-light'
        />
      ),
      animation: 'fade-up',
    },
    {
      id: 3,
      title: 'آرامش خاطر',
      description:
        'با تمرکز بر حرکات آرام و تنفس عمیق، یوگا و مدیتیشن به شما کمک می‌کنند که ذهن خود را از نگرانی‌های روزمره آزاد کنید.',
      icon: (
        <RiUserHeartLine
          size={46}
          className='text-accent transition-colors duration-300 ease-in group-hover:text-background-light group-hover:dark:text-text-light'
        />
      ),
      animation: 'fade-left',
    },
  ];

  return (
    <div className='flex flex-col items-center justify-center gap-8 py-12 md:gap-12 md:py-16'>
      <h2 className='text-2xl font-bold sm:text-3xl lg:text-4xl xl:text-5xl'>
        چرا یوگا و مدیتیشن
      </h2>
      <div className='container grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 md:gap-8 lg:gap-12 xl:px-32'>
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            data-aos={benefit.animation}
            data-aos-duration='1000'
          >
            <BenefitsCard benefit={benefit} className='h-full' />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BenefitsSection;
