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
        'با تمرین‌های منظم یوگا، بدن قوی‌تر، منعطف‌تر و هماهنگ‌تر می‌شود.',
      icon: (
        <FaWalking
          size={42}
          className='text-secondary transition-all duration-500 group-hover:text-white'
        />
      ),
      animation: 'fade-right',
    },

    {
      id: 2,
      title: 'آرامش ذهن',
      description:
        'مدیتیشن و تمرین تنفس به کاهش استرس و افزایش تمرکز کمک می‌کند.',
      icon: (
        <LuBrain
          size={42}
          className='text-secondary transition-all duration-500 group-hover:text-white'
        />
      ),
      animation: 'fade-up',
    },

    {
      id: 3,
      title: 'تعادل زندگی',
      description: 'مسیر رشد شخصی برای هماهنگی بیشتر جسم، ذهن و احساس.',
      icon: (
        <RiUserHeartLine
          size={42}
          className='text-secondary transition-all duration-500 group-hover:text-white'
        />
      ),
      animation: 'fade-left',
    },
  ];

  return (
    <section className='relative overflow-hidden py-6 md:py-10'>
      <div className='container flex flex-col items-center'>
        <h2 className='mb-4 text-center text-3xl font-black leading-[1.6] text-text-light sm:text-4xl lg:text-5xl dark:text-text-dark'>
          چرا
          <span className='relative mx-2 inline-block text-secondary'>
            یوگا و مدیتیشن
            <svg
              aria-hidden='true'
              viewBox='0 0 170 18'
              preserveAspectRatio='none'
              className='text-yellow pointer-events-none absolute -bottom-1 right-0 h-3 w-full'
            >
              <path
                d='M4 12C36 4 68 16 101 9C126 4 147 5 166 9'
                fill='none'
                stroke='currentColor'
                strokeWidth='4'
                strokeLinecap='round'
                opacity='0.75'
              />
            </svg>
          </span>
        </h2>

        <p className='mb-12 max-w-2xl text-center text-gray-500 dark:text-gray-400'>
          مسیری برای آرامش ذهن، سلامت بدن و تجربه یک زندگی متعادل‌تر
        </p>

        <div className='grid w-full grid-cols-1 gap-6 md:grid-cols-3'>
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
    </section>
  );
};

export default BenefitsSection;
