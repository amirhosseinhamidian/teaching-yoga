/* eslint-disable no-undef */
'use client';
import Button from '@/components/Ui/Button/Button';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const Hero = () => {
  const [siteInfoData, setSiteInfoData] = useState(null);
  const fetchData = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/site-info`,
        {
          method: 'GET',
          next: {
            revalidate: 86400, // 1 day
          },
        },
      );
      if (!res.ok) {
        throw new Error('Error to fetch footer data!');
      }
      const data = await res.json();
      console.log(data);
      setSiteInfoData(data);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <div className='bg-surface-light shadow-accent-custom-bottom dark:bg-surface-dark'>
      <div className='container grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 sm:gap-2 xl:grid-cols-3'>
        {/* Left Section */}
        <div className='col-span-1 sm:mb-8 md:pr-10'>
          <h1
            className='font-fancy text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
            data-aos='fade-up'
            data-aos-delay='200'
            data-aos-duration='1000'
          >
            درود و نور بر {'  '} قلبتون؛ <br /> سمانه هستم مدرس بین المللی یوگا
            و مدیتیشن
          </h1>
          <p
            className='mb-6 mt-2 text-xs text-subtext-light xs:text-sm sm:text-base dark:text-subtext-dark'
            data-aos='fade-up'
            data-aos-delay='400'
            data-aos-duration='1000'
          >
            با من همراه شوید تا با تمرینات روزانه یوگا، مراقبه و تکنیک‌های
            تنفسی، ذهن و بدن خود را تقویت کنید و به یک زندگی متعادل‌تر و آرام‌تر
            دست یابید. آماده‌اید سفر درونی خود را آغاز کنید؟
          </p>
          <Link
            href='/courses'
            data-aos='fade-up'
            data-aos-delay='600'
            data-aos-duration='1000'
          >
            <Button shadow>شروع همراهی</Button>
          </Link>
        </div>

        {/* Right Section */}
        <div className='relative col-span-1 flex items-end justify-center sm:mt-0 xl:col-span-2'>
          {/* Gradient Circle */}
          <div
            className='h-36 w-36 rounded-full bg-gradient-to-t from-[#193D2B] to-[#64F4AB] xs:h-48 xs:w-48 sm:h-60 sm:w-60 md:h-80 md:w-80 lg:h-[360px] lg:w-[360px] xl:h-96 xl:w-96'
            data-aos='zoom-in'
            data-aos-duration='1000'
          ></div>

          {/* Hero Image */}
          <Image
            src={siteInfoData?.heroImage || '/images/hero.png'}
            alt='hero pic'
            width={2500}
            height={2500}
            className='absolute max-w-56 object-contain xs:max-w-72 sm:max-w-[340px] md:max-w-[440px] lg:max-w-[540px]'
            data-aos='fade-up'
            data-aos-duration='1500'
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
