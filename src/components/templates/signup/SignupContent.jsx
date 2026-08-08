/* eslint-disable react/prop-types */
'use client';

import React, { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Logo from '@/components/Logo/Logo';
import Input from '@/components/Ui/Input/Input';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineFingerPrint,
  HiOutlineLockClosed,
  HiOutlinePlayCircle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineUser,
} from 'react-icons/hi2';

import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserForm } from '@/hooks/auth/useUserForm';
import { useUserActions } from '@/hooks/auth/useUserActions';
import { useTheme } from '@/contexts/ThemeContext';

import { createToastHandler } from '@/utils/toastHandler';

const SignupContent = () => {
  const router = useRouter();

  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // وضعیت واقعی کاربر
  const { user } = useAuthUser();

  // وضعیت موقت فرم ثبت‌نام
  const { username, setUsername, phone, setPhone, setOtpToken } = useUserForm();

  // اکشن ارسال OTP
  const { sendOtp } = useUserActions();

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Auth guard
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const backwardHandle = () => {
    router.back();
  };

  /*
  |--------------------------------------------------------------------------
  | Signup
  |--------------------------------------------------------------------------
  */

  const signupHandle = async () => {
    if (isSubmitting) {
      return;
    }

    if (!username || !phone) {
      toast.showErrorToast('لطفاً نام کاربری و شماره موبایل را وارد کنید.');

      return;
    }

    setIsSubmitting(true);

    try {
      // 1) اعتبارسنجی نام کاربری + شماره موبایل
      const validationReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/signup-validation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            phone,
          }),
        }
      );

      const validation = await validationReq.json();

      if (!validation.success) {
        toast.showErrorToast(validation.error || 'خطا در ثبت نام');

        return;
      }

      // 2) ارسال OTP با همان Redux Thunk فعلی
      const result = await sendOtp(phone);

      if (result.meta.requestStatus === 'fulfilled') {
        // token همان مقداری است که جریان فعلی Confirm Code انتظار دارد.
        setOtpToken(result.payload.token);

        router.push('/confirm-code');

        return;
      }

      toast.showErrorToast(result.payload || 'ارسال کد ناموفق بود.');
    } catch (error) {
      console.error('[SIGNUP_ERROR]', error);

      toast.showErrorToast('خطا در ارتباط با سرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      dir='rtl'
      className='relative isolate min-h-[100dvh] overflow-hidden bg-background-light transition-colors duration-300 dark:bg-background-dark'
    >
      <PageBackground />

      {/* Ambient background lights */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute right-[-12rem] top-[-10rem] h-[38rem] w-[38rem] rounded-full bg-secondary/[0.08] blur-[125px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/[0.10] pointer-events-none absolute bottom-[-14rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full blur-[120px]'
      />

      <div className='relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1440px] items-center px-4 py-5 sm:px-6 sm:py-8 lg:px-8'>
        <div className='grid w-full overflow-hidden rounded-[32px] border border-black/[0.05] bg-surface-light/80 shadow-[0_35px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr] dark:border-white/10 dark:bg-surface-dark/75 dark:shadow-[0_35px_100px_rgba(0,0,0,0.30)]'>
          {/* =====================================================
              FORM
          ====================================================== */}
          <section className='relative order-2 flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:order-1 lg:px-12 xl:px-16'>
            <div
              aria-hidden='true'
              className='bg-yellow/[0.07] pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-[90px]'
            />

            <div className='relative z-10 w-full max-w-[440px]'>
              {/* Mobile header */}
              <div className='mb-7 flex items-center justify-between lg:hidden'>
                <button
                  type='button'
                  onClick={backwardHandle}
                  aria-label='بازگشت'
                  className='flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-background-light/55 text-text-light transition hover:border-secondary/20 hover:text-secondary dark:border-white/10 dark:bg-background-dark/35 dark:text-text-dark'
                >
                  <HiOutlineArrowRight size={19} />
                </button>

                <Link href='/' aria-label='صفحه اصلی سمانه یوگا'>
                  <Logo />
                </Link>

                <span className='h-10 w-10' aria-hidden='true' />
              </div>

              {/* Step indicator */}
              <div className='mb-6 flex items-center gap-2.5'>
                <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-secondary font-faNa text-xs font-black text-white shadow-[0_8px_25px_rgba(38,145,125,0.18)]'>
                  ۱
                </span>

                <div className='h-px flex-1 bg-gradient-to-l from-secondary/35 to-black/[0.04] dark:to-white/[0.06]' />

                <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-background-light/50 font-faNa text-xs font-black text-subtext-light dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'>
                  ۲
                </span>
              </div>

              <div className='mb-4 flex items-center justify-between gap-4'>
                <SiteBadge variant='secondary' size='sm'>
                  <span className='flex items-center gap-1.5'>
                    <HiOutlineSparkles size={14} />
                    ساخت حساب جدید
                  </span>
                </SiteBadge>

                <button
                  type='button'
                  onClick={backwardHandle}
                  className='hidden items-center gap-1.5 text-[10px] font-bold text-subtext-light transition-colors hover:text-secondary lg:flex dark:text-subtext-dark'
                >
                  <HiOutlineArrowRight size={14} />
                  بازگشت
                </button>
              </div>

              <h1 className='text-2xl font-black leading-[1.7] text-text-light sm:text-3xl dark:text-text-dark'>
                حساب شخصی‌ات را
                <span className='mr-2 text-secondary'>بساز</span>
              </h1>

              <p className='mt-2 max-w-md text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
                فقط نام کاربری و شماره موبایل را وارد کن؛ در مرحله بعد با یک کد
                یکبارمصرف، شماره‌ات تأیید می‌شود.
              </p>

              {/* Form fields */}
              <div className='mt-7 space-y-5'>
                <div>
                  <div className='mb-2.5 flex items-center justify-between gap-3'>
                    <label className='flex items-center gap-1.5 text-xs font-black text-text-light dark:text-text-dark'>
                      <HiOutlineUser size={17} className='text-secondary' />
                      نام کاربری
                    </label>

                    <span className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                      نامی که در حساب نمایش داده می‌شود
                    </span>
                  </div>

                  <Input
                    value={username}
                    onChange={setUsername}
                    fullWidth
                    placeholder='نام کاربری'
                    focus
                    onEnterPress={() => {
                      if (phone) {
                        signupHandle();
                      }
                    }}
                    className='min-h-[54px] w-full bg-background-light/60 text-base dark:bg-background-dark/40'
                  />
                </div>

                <div>
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

                  <Input
                    value={phone}
                    onChange={setPhone}
                    fullWidth
                    placeholder='شماره همراه'
                    onEnterPress={signupHandle}
                    type='tel'
                    maxLength={20}
                    className='min-h-[54px] w-full bg-background-light/60 text-right text-lg dark:bg-background-dark/40'
                  />
                </div>
              </div>

              {/* What happens next */}
              <div className='mt-5 flex items-start gap-3 rounded-[20px] border border-secondary/10 bg-secondary/[0.045] p-4'>
                <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                  <HiOutlineFingerPrint size={18} />
                </span>

                <div>
                  <p className='text-[10px] font-black text-text-light sm:text-xs dark:text-text-dark'>
                    مرحله بعد: تأیید شماره موبایل
                  </p>

                  <p className='mt-1 text-[9px] leading-6 text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                    بعد از ادامه، یک کد ۵ رقمی برای این شماره ارسال می‌شود و
                    ثبت‌نام با تأیید آن کامل خواهد شد.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <SiteButton
                type='button'
                variant='primary'
                size='lg'
                endIcon={HiOutlineArrowLeft}
                disabled={isSubmitting}
                onClick={signupHandle}
                className='mt-5 w-full'
              >
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    در حال بررسی اطلاعات...
                  </span>
                ) : (
                  'ادامه و دریافت کد'
                )}
              </SiteButton>

              {/* Existing account */}
              <div className='mt-6 rounded-[20px] border border-black/5 bg-background-light/45 px-4 py-4 text-center dark:border-white/10 dark:bg-background-dark/25'>
                <p className='text-xs text-subtext-light dark:text-subtext-dark'>
                  قبلاً حساب ساخته‌اید؟
                </p>

                <Link
                  href='/login'
                  className='mt-1.5 inline-flex items-center gap-1 text-xs font-black text-secondary transition-opacity hover:opacity-70'
                >
                  ورود به حساب
                  <HiOutlineArrowLeft size={14} />
                </Link>
              </div>

              {/* Rules */}
              <p className='mt-5 text-center text-[9px] leading-6 text-subtext-light/80 dark:text-subtext-dark/80'>
                ادامه ثبت‌نام به معنای پذیرش{' '}
                <Link
                  href='/rules'
                  className='font-bold text-text-light underline decoration-secondary/30 underline-offset-4 dark:text-text-dark'
                >
                  قوانین و مقررات
                </Link>{' '}
                سمانه یوگا است.
              </p>

              <div className='mt-4 flex items-center justify-center gap-1.5 text-[9px] text-subtext-light dark:text-subtext-dark'>
                <HiOutlineLockClosed size={13} className='text-secondary' />
                اطلاعات شما فقط برای ساخت و مدیریت حساب استفاده می‌شود.
              </div>
            </div>
          </section>

          {/* =====================================================
              BRAND PANEL
          ====================================================== */}
          <section className='relative order-1 hidden overflow-hidden border-r border-black/[0.04] lg:flex dark:border-white/10'>
            <div className='to-yellow/[0.13] absolute inset-0 bg-gradient-to-br from-secondary/[0.17] via-secondary/[0.045]' />

            {/* Decorative rings */}
            <div
              aria-hidden='true'
              className='absolute -right-28 top-8 h-80 w-80 rounded-full border border-secondary/10'
            />

            <div
              aria-hidden='true'
              className='absolute -right-8 top-28 h-52 w-52 rounded-full border border-secondary/15'
            />

            <div
              aria-hidden='true'
              className='bg-yellow/[0.11] absolute -bottom-36 -left-24 h-[28rem] w-[28rem] rounded-full blur-[90px]'
            />

            {/* Large abstract user / path symbol */}
            <div
              aria-hidden='true'
              className='pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 opacity-[0.065]'
            >
              <HiOutlineAcademicCap
                size={390}
                strokeWidth={0.62}
                className='text-secondary'
              />
            </div>

            <div className='relative z-10 flex w-full flex-col justify-between p-10 xl:p-12'>
              {/* Header */}
              <div className='flex items-center justify-between'>
                <Link href='/' aria-label='صفحه اصلی سمانه یوگا'>
                  <Logo />
                </Link>

                <SiteBadge variant='secondary' size='sm'>
                  شروع مسیر شما
                </SiteBadge>
              </div>

              {/* Main copy */}
              <div className='max-w-xl'>
                <p className='text-xs font-black text-secondary'>
                  یک حساب، برای تمام مسیر
                </p>

                <h2 className='mt-3 text-3xl font-black leading-[1.8] text-text-light xl:text-[38px] dark:text-text-dark'>
                  فضای شخصی برای تمرین، یادگیری و
                  <span className='mr-2 text-secondary'>پیشرفت</span>
                </h2>

                <p className='mt-3 max-w-md text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
                  بعد از ساخت حساب، دوره‌ها، جلسات، خریدها و ارتباط با پشتیبانی
                  در یک فضای شخصی و منظم در دسترس شماست.
                </p>

                {/* Feature cards */}
                <div className='mt-7 grid grid-cols-2 gap-3'>
                  <AuthFeature
                    icon={HiOutlinePlayCircle}
                    title='جلسات و تمرین‌ها'
                    description='ادامه مسیر از آخرین جلسه'
                  />

                  <AuthFeature
                    icon={HiOutlineAcademicCap}
                    title='دوره‌های شما'
                    description='دسترسی یکپارچه به آموزش‌ها'
                  />

                  <AuthFeature
                    icon={HiOutlineCheckCircle}
                    title='مسیر منظم'
                    description='همه چیز در یک حساب شخصی'
                  />

                  <AuthFeature
                    icon={HiOutlineShieldCheck}
                    title='ثبت‌نام امن'
                    description='تأیید شماره با کد یکبارمصرف'
                  />
                </div>
              </div>

              {/* Footer */}
              <div className='flex items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                  <span className='flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                    <HiOutlineShieldCheck size={18} />
                  </span>

                  <div>
                    <p className='text-[10px] font-black text-text-light dark:text-text-dark'>
                      ثبت‌نام سریع و ساده
                    </p>

                    <p className='mt-0.5 text-[9px] text-subtext-light dark:text-subtext-dark'>
                      بدون رمز عبور؛ فقط با موبایل
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

function AuthFeature({ icon: Icon, title, description }) {
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

export default SignupContent;
