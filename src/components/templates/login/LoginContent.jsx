/* eslint-disable react/prop-types */
'use client';

import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import Logo from '@/components/Logo/Logo';

import Input from '@/components/Ui/Input/Input';
import GoogleLoginButton from '@/components/Ui/GoogleLoginButton/GoogleLoginButton';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineHeart,
  HiOutlineLockClosed,
  HiOutlinePlayCircle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { useAuthUser } from '@/hooks/auth/useAuthUser';

import { useUserForm } from '@/hooks/auth/useUserForm';

import { useTheme } from '@/contexts/ThemeContext';

import { validatePhoneNumber } from '@/utils/validatePhoneNumber';

import { createToastHandler } from '@/utils/toastHandler';

import { CheckPhoneAction } from '@/app/actions/CheckPhoneAction';

const LoginContent = () => {
  const router = useRouter();

  const inputRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Auth
  |--------------------------------------------------------------------------
  */

  const { user } = useAuthUser();

  const { phone, setPhone, setOtpToken } = useUserForm();

  const { isDark } = useTheme();

  const toast = createToastHandler(isDark);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Logged-in user
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  /*
  |--------------------------------------------------------------------------
  | Mobile keyboard
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handler = () => {
      const el = inputRef.current;

      if (!window.visualViewport || !el) {
        return;
      }

      const { height } = window.visualViewport;

      const rect = el.getBoundingClientRect();

      if (rect.bottom > height) {
        window.scrollTo({
          top: rect.top + window.scrollY - 20,

          behavior: 'smooth',
        });
      }
    };

    window.visualViewport?.addEventListener('resize', handler);

    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const loginHandler = async () => {
    setIsSubmitting(true);

    /*
     * 1. Validate phone
     */
    const validation = validatePhoneNumber(phone);

    if (!validation.isValid) {
      toast.showErrorToast(validation.errorMessage);

      setIsSubmitting(false);

      return;
    }

    /*
     * 2. Check user
     */
    const check = await CheckPhoneAction(phone);

    if (!check) {
      router.push('/signup');

      setIsSubmitting(false);

      return;
    }

    /*
     * 3. Send OTP
     */
    try {
      const req = await fetch('/api/send-otp', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          phone,
        }),
      });

      const data = await req.json();

      if (data.success) {
        setOtpToken(data.challengeId);

        router.push('/confirm-code');
      } else {
        toast.showErrorToast(data.error || 'ارسال کد ناموفق بود.');
      }
    } catch (err) {
      console.error('[LOGIN_SEND_OTP]', err);

      toast.showErrorToast('خطا در ارتباط با سرور.');
    }

    setIsSubmitting(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-[100dvh] overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      {/* Ambient decorations */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute right-[-10rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-secondary/[0.08] blur-[120px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/[0.10] pointer-events-none absolute bottom-[-12rem] left-[-8rem] h-[32rem] w-[32rem] rounded-full blur-[120px]'
      />

      <div className='relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1440px] items-center px-4 py-5 sm:px-6 sm:py-8 lg:px-8'>
        <div className='grid w-full overflow-hidden rounded-[32px] border border-black/[0.05] bg-surface-light/80 shadow-[0_35px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr] dark:border-white/10 dark:bg-surface-dark/75 dark:shadow-[0_35px_100px_rgba(0,0,0,0.30)]'>
          {/* =====================================================
              Form
          ====================================================== */}
          <section className='relative order-2 flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:order-1 lg:px-12 xl:px-16'>
            <div
              aria-hidden='true'
              className='bg-yellow/[0.07] pointer-events-none absolute -bottom-24 -right-24 h-60 w-60 rounded-full blur-[80px]'
            />

            <div className='relative z-10 w-full max-w-[430px]'>
              {/* Mobile logo */}
              <div className='mb-8 flex justify-center lg:hidden'>
                <Link href='/' aria-label='صفحه اصلی سمانه یوگا'>
                  <Logo />
                </Link>
              </div>

              <SiteBadge variant='secondary' size='sm'>
                <span className='flex items-center gap-1.5'>
                  <HiOutlineSparkles size={14} />
                  خوش برگشتی
                </span>
              </SiteBadge>

              <h1 className='mt-4 text-2xl font-black leading-[1.7] text-text-light sm:text-3xl dark:text-text-dark'>
                ورود به حساب
                <div className='relative mr-2 inline text-secondary'>
                  سمانه یوگا
                  <svg
                    aria-hidden='true'
                    viewBox='0 0 260 22'
                    preserveAspectRatio='none'
                    className='text-yellow pointer-events-none absolute -bottom-2 right-0 h-3 w-full'
                  >
                    <path
                      d='M5 14C54 4 102 18 151 10C191 4 223 6 255 11'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='5'
                      strokeLinecap='round'
                      opacity='0.8'
                    />

                    <path
                      d='M25 19C74 14 126 19 183 14'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      opacity='0.35'
                    />
                  </svg>
                </div>
              </h1>

              <p className='mt-2 max-w-sm text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
                شماره موبایلی که با آن ثبت‌نام کرده‌اید را وارد کنید. کد تأیید
                برای شما ارسال خواهد شد.
              </p>

              {/* Phone field */}
              <div className='mt-7'>
                <div className='mb-2.5 flex items-center justify-between gap-3'>
                  <label className='flex items-center gap-1.5 text-xs font-black text-text-light dark:text-text-dark'>
                    <HiOutlineDevicePhoneMobile
                      size={17}
                      className='text-secondary'
                    />
                    شماره موبایل
                  </label>

                  <span className='font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                    مثال: ۰۹۱۲۱۲۳۴۵۶۷
                  </span>
                </div>

                <div className='relative'>
                  <Input
                    ref={inputRef}
                    value={phone}
                    onChange={setPhone}
                    fullWidth
                    placeholder='شماره همراه'
                    focus
                    onEnterPress={loginHandler}
                    type='tel'
                    maxLength={20}
                    className='min-h-[54px] w-full bg-background-light/60 text-lg dark:bg-background-dark/40'
                  />
                </div>
              </div>

              {/* Main CTA */}
              <SiteButton
                type='button'
                variant='primary'
                size='lg'
                endIcon={HiOutlineArrowLeft}
                disabled={isSubmitting}
                onClick={loginHandler}
                className='mt-5 w-full'
              >
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    در حال بررسی...
                  </span>
                ) : (
                  'ورود و دریافت کد'
                )}
              </SiteButton>

              {/* Security */}
              <div className='mt-3 flex items-center justify-center gap-1.5 text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                <HiOutlineLockClosed size={13} className='text-secondary' />
                ورود امن با کد یکبار مصرف
              </div>

              {/* Divider */}
              <div className='my-7 flex items-center gap-3'>
                <span className='h-px flex-1 bg-black/[0.06] dark:bg-white/10' />

                <span className='text-[10px] font-bold text-subtext-light dark:text-subtext-dark'>
                  یا
                </span>

                <span className='h-px flex-1 bg-black/[0.06] dark:bg-white/10' />
              </div>

              {/* Google */}
              <div className='overflow-hidden rounded-2xl'>
                <GoogleLoginButton />
              </div>

              {/* Sign up */}
              <div className='mt-7 rounded-[20px] border border-black/5 bg-background-light/45 px-4 py-4 text-center dark:border-white/10 dark:bg-background-dark/25'>
                <p className='text-xs text-subtext-light dark:text-subtext-dark'>
                  هنوز حساب کاربری ندارید؟
                </p>

                <Link
                  href='/signup'
                  className='mt-1.5 inline-flex items-center gap-1 text-xs font-black text-secondary transition-opacity hover:opacity-70'
                >
                  ساخت حساب جدید
                  <HiOutlineArrowLeft size={14} />
                </Link>
              </div>

              {/* Terms */}
              <p className='mt-5 text-center text-[9px] leading-6 text-subtext-light/80 dark:text-subtext-dark/80'>
                با ورود به حساب،{' '}
                <Link
                  href='/rules'
                  className='font-bold text-text-light underline decoration-secondary/30 underline-offset-4 dark:text-text-dark'
                >
                  قوانین و مقررات
                </Link>{' '}
                سمانه یوگا را می‌پذیرید.
              </p>
            </div>
          </section>

          {/* =====================================================
              Brand visual
          ====================================================== */}
          <section className='relative order-1 hidden overflow-hidden border-r border-black/[0.04] lg:flex dark:border-white/10'>
            {/* Background */}
            <div className='to-yellow/[0.12] absolute inset-0 bg-gradient-to-br from-secondary/[0.16] via-secondary/[0.045]' />

            <div
              aria-hidden='true'
              className='absolute -right-28 top-10 h-80 w-80 rounded-full border border-secondary/10'
            />

            <div
              aria-hidden='true'
              className='absolute -right-10 top-28 h-52 w-52 rounded-full border border-secondary/15'
            />

            <div
              aria-hidden='true'
              className='bg-yellow/[0.10] absolute -bottom-36 -left-24 h-[28rem] w-[28rem] rounded-full blur-[90px]'
            />

            {/* Yoga abstract figure */}
            <div className='pointer-events-none absolute left-1/2 top-[48%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]'>
              <div className='absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full border-[18px] border-secondary' />

              <div className='absolute left-1/2 top-[108px] h-[180px] w-[180px] -translate-x-1/2 rounded-[50%_50%_42%_42%] border-[18px] border-secondary' />

              <div className='absolute bottom-16 left-1/2 h-[110px] w-[340px] -translate-x-1/2 rounded-[50%] border-[20px] border-secondary' />
            </div>

            <div className='relative z-10 flex w-full flex-col justify-between p-10 xl:p-12'>
              {/* Logo */}
              <div className='flex items-center justify-between'>
                <Link href='/' aria-label='صفحه اصلی سمانه یوگا'>
                  <Logo />
                </Link>

                <SiteBadge variant='secondary' size='sm'>
                  فضای شخصی شما
                </SiteBadge>
              </div>

              {/* Main */}
              <div className='max-w-xl'>
                <p className='text-xs font-black text-secondary'>
                  ادامه مسیر از همین‌جا
                </p>

                <h2 className='mt-3 text-3xl font-black leading-[1.8] text-text-light xl:text-[38px] dark:text-text-dark'>
                  تمرین‌ها، دوره‌ها و مسیر رشد شما
                  <span className='mr-2 text-secondary'>یک‌جا</span>
                </h2>

                <p className='mt-3 max-w-md text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
                  با ورود به حساب خود، به دوره‌های خریداری‌شده، جلسات تمرین،
                  پیشرفت آموزشی و خدمات پشتیبانی دسترسی خواهید داشت.
                </p>

                {/* Features */}
                <div className='mt-7 grid grid-cols-2 gap-3'>
                  <FeatureCard
                    icon={HiOutlinePlayCircle}
                    title='دوره‌های من'
                    description='دسترسی سریع به جلسات'
                  />

                  <FeatureCard
                    icon={HiOutlineAcademicCap}
                    title='مسیر یادگیری'
                    description='ادامه تمرین از آخرین جلسه'
                  />

                  <FeatureCard
                    icon={HiOutlineHeart}
                    title='تمرین مستمر'
                    description='همراه مسیر روزانه شما'
                  />

                  <FeatureCard
                    icon={HiOutlineShieldCheck}
                    title='حساب امن'
                    description='ورود با کد یکبار مصرف'
                  />
                </div>
              </div>

              {/* Footer */}
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                  <div className='flex -space-x-2 space-x-reverse'>
                    {[1, 2, 3].map((item) => (
                      <span
                        key={item}
                        className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-light bg-secondary/10 text-[9px] font-black text-secondary dark:border-surface-dark'
                      >
                        ✓
                      </span>
                    ))}
                  </div>

                  <div>
                    <p className='text-[10px] font-black text-text-light dark:text-text-dark'>
                      همراه هنرجویان سمانه یوگا
                    </p>

                    <p className='mt-0.5 text-[9px] text-subtext-light dark:text-subtext-dark'>
                      تمرین آگاهانه، مسیر مستمر
                    </p>
                  </div>
                </div>

                <HiOutlineSparkles size={24} className='text-secondary/50' />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

/*
|--------------------------------------------------------------------------
| Feature
|--------------------------------------------------------------------------
*/

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className='group rounded-[20px] border border-black/[0.045] bg-surface-light/45 p-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/20 hover:bg-surface-light/70 dark:border-white/10 dark:bg-surface-dark/35 dark:hover:bg-surface-dark/55'>
      <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-secondary transition-all duration-300 group-hover:bg-secondary group-hover:text-white'>
        <Icon size={18} />
      </span>

      <h3 className='mt-3 text-xs font-black text-text-light dark:text-text-dark'>
        {title}
      </h3>

      <p className='mt-1 text-[9px] leading-5 text-subtext-light dark:text-subtext-dark'>
        {description}
      </p>
    </div>
  );
}

export default LoginContent;
