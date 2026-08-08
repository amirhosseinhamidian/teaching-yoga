/* eslint-disable react/prop-types */
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { motion } from 'framer-motion';

import Logo from '@/components/Logo/Logo';

import PageBackground from '@/components/SiteUi/PageBackground/PageBackground';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiOutlineDevicePhoneMobile,
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlinePencilSquare,
  HiOutlinePlayCircle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import { useUserForm } from '@/hooks/auth/useUserForm';
import { useUserActions } from '@/hooks/auth/useUserActions';
import { useCartActions } from '@/hooks/cart/useCartActions';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

import { useTheme } from '@/contexts/ThemeContext';

import { createToastHandler } from '@/utils/toastHandler';

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const OTP_LENGTH = 5;

const OTP_TIMER_SECONDS = 120;

const SUCCESS_REDIRECT_DELAY = 1250;

const persianDigits = '۰۱۲۳۴۵۶۷۸۹';

const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeDigits(value) {
  return String(value || '')
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/\D/g, '');
}

function toPersianDigits(value) {
  return String(value ?? '').replace(
    /\d/g,
    (digit) => persianDigits[Number(digit)]
  );
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

const ConfirmCodeContent = () => {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | Auth
  |--------------------------------------------------------------------------
  */

  const { user } = useAuthUser();

  const { phone, username, otpToken, setOtpToken, clearForm } = useUserForm();

  const { loginOtp, loadUser } = useUserActions();

  const { fetchCart } = useCartActions();

  const { isDark } = useTheme();

  const toast = createToastHandler(isDark);

  /*
  |--------------------------------------------------------------------------
  | Refs
  |--------------------------------------------------------------------------
  */

  const inputRefs = useRef([]);

  /*
   * جلوگیری از ارسال همزمان Request:
   * مثلاً Auto Submit + کلیک دستی
   */
  const submitLockRef = useRef(false);

  /*
   * Ref کل مجموعه OTP.
   * برای پیدا کردن مرکز واقعی مربع‌ها استفاده می‌شود.
   */
  const otpGroupRef = useRef(null);

  /*
  |--------------------------------------------------------------------------
  | OTP states
  |--------------------------------------------------------------------------
  */

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));

  /*
   * idle
   * error
   * success
   */
  const [verificationState, setVerificationState] = useState('idle');

  const [errorMessage, setErrorMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isResending, setIsResending] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Timer states
  |--------------------------------------------------------------------------
  */

  const [remainingSeconds, setRemainingSeconds] = useState(OTP_TIMER_SECONDS);

  /*
   * با تغییر این مقدار Timer عمداً Reset می‌شود.
   * فقط هنگام Resend استفاده می‌کنیم.
   */
  const [timerCycle, setTimerCycle] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | Success animation
  |--------------------------------------------------------------------------
  */

  /*
   * میزان حرکت واقعی هر مربع برای رسیدن
   * به مرکز گروه.
   */
  const [mergeOffsets, setMergeOffsets] = useState(Array(OTP_LENGTH).fill(0));

  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const confirmCode = useMemo(() => digits.join(''), [digits]);

  const isComplete = useMemo(
    () => digits.every((digit) => digit !== ''),
    [digits]
  );

  const isFinished = remainingSeconds <= 0;

  const time = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);

    const seconds = remainingSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }, [remainingSeconds]);

  const timerProgress = useMemo(
    () =>
      Math.max(0, Math.min(100, (remainingSeconds / OTP_TIMER_SECONDS) * 100)),
    [remainingSeconds]
  );

  /*
  |--------------------------------------------------------------------------
  | Timer
  |--------------------------------------------------------------------------
  |
  | این Timer کاملاً مستقل از verificationState است.
  |
  | بنابراین:
  |
  | idle -> error
  | error -> idle
  |
  | باعث ساخت Timer جدید نمی‌شوند.
  |
  | فقط:
  | - otpToken جدید
  | - timerCycle جدید
  |
  | Timer را Reset می‌کنند.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!otpToken) {
      return undefined;
    }

    setRemainingSeconds(OTP_TIMER_SECONDS);

    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);

      const nextSeconds = Math.max(0, OTP_TIMER_SECONDS - elapsedSeconds);

      setRemainingSeconds(nextSeconds);

      if (nextSeconds <= 0) {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [otpToken, timerCycle]);

  /*
  |--------------------------------------------------------------------------
  | Auth guard
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    /*
     * هنگام نمایش Animation موفقیت
     * هیچ Redirect دیگری انجام نشود.
     */
    if (verificationState === 'success') {
      return;
    }

    /*
     * هنوز Context آماده نشده.
     */
    if (otpToken === undefined) {
      return;
    }

    if (user) {
      router.replace('/');

      return;
    }

    if (!otpToken) {
      router.replace('/login');
    }
  }, [otpToken, user, router, verificationState]);

  /*
  |--------------------------------------------------------------------------
  | Initial focus
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!otpToken) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [otpToken]);

  /*
  |--------------------------------------------------------------------------
  | Edit phone
  |--------------------------------------------------------------------------
  */

  const backwardHandle = () => {
    /*
     * شماره Phone را پاک نمی‌کنیم.
     *
     * بنابراین Login همان شماره قبلی
     * را نمایش می‌دهد و کاربر فقط
     * آن را ویرایش می‌کند.
     */

    setOtpToken(null);

    router.replace('/login');
  };

  /*
  |--------------------------------------------------------------------------
  | Clear error state
  |--------------------------------------------------------------------------
  */

  const clearErrorState = useCallback(() => {
    if (verificationState !== 'error') {
      return;
    }

    setVerificationState('idle');

    setErrorMessage('');
  }, [verificationState]);

  /*
  |--------------------------------------------------------------------------
  | Success merge position
  |--------------------------------------------------------------------------
  |
  | به‌جای حدس زدن x بر اساس index،
  | موقعیت واقعی تمام Inputها را از DOM
  | می‌گیریم.
  |
  | بنابراین:
  | RTL / LTR
  | Mobile / Desktop
  | Gap
  | اندازه Input
  |
  | هیچ‌کدام مشکلی ایجاد نمی‌کنند.
  |--------------------------------------------------------------------------
  */

  const prepareSuccessMerge = useCallback(() => {
    const group = otpGroupRef.current;

    if (!group) {
      return;
    }

    const groupRect = group.getBoundingClientRect();

    const groupCenterX = groupRect.left + groupRect.width / 2;

    const offsets = Array.from(
      {
        length: OTP_LENGTH,
      },
      (_, index) => {
        const input = inputRefs.current[index];

        if (!input) {
          return 0;
        }

        const inputRect = input.getBoundingClientRect();

        const inputCenterX = inputRect.left + inputRect.width / 2;

        /*
         * مقدار مثبت:
         * حرکت به راست
         *
         * مقدار منفی:
         * حرکت به چپ
         */
        return groupCenterX - inputCenterX;
      }
    );

    setMergeOffsets(offsets);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Distribute OTP
  |--------------------------------------------------------------------------
  */

  const distributeDigits = useCallback(
    (startIndex, rawValue) => {
      if (verificationState === 'success') {
        return;
      }

      clearErrorState();

      const clean = normalizeDigits(rawValue);

      /*
       * Input پاک شده.
       */
      if (!clean) {
        setDigits((previous) => {
          const next = [...previous];

          next[startIndex] = '';

          return next;
        });

        return;
      }

      /*
       * اگر Clipboard / Autofill
       * یک OTP کامل داشت،
       * از اولین خانه توزیع شود.
       *
       * حتی اگر Paste روی خانه سوم
       * انجام شده باشد.
       */
      const actualStart = clean.length >= OTP_LENGTH ? 0 : startIndex;

      const values = clean.slice(0, OTP_LENGTH).split('');

      setDigits((previous) => {
        const next = [...previous];

        values.forEach((digit, offset) => {
          const target = actualStart + offset;

          if (target < OTP_LENGTH) {
            next[target] = digit;
          }
        });

        return next;
      });

      const afterLastInserted = actualStart + values.length;

      /*
       * هنوز خانه‌ای باقی مانده.
       */
      if (afterLastInserted < OTP_LENGTH) {
        requestAnimationFrame(() => {
          inputRefs.current[afterLastInserted]?.focus();
        });

        return;
      }

      /*
       * هر پنج رقم کامل شده.
       */
      requestAnimationFrame(() => {
        inputRefs.current[OTP_LENGTH - 1]?.blur();
      });
    },
    [verificationState, clearErrorState]
  );

  /*
  |--------------------------------------------------------------------------
  | Input change
  |--------------------------------------------------------------------------
  */

  const handleChange = (index, event) => {
    distributeDigits(index, event.target.value);
  };

  /*
  |--------------------------------------------------------------------------
  | Paste
  |--------------------------------------------------------------------------
  */

  const handlePaste = (index, event) => {
    event.preventDefault();

    const text = event.clipboardData.getData('text');

    distributeDigits(index, text);
  };

  /*
  |--------------------------------------------------------------------------
  | Keyboard navigation
  |--------------------------------------------------------------------------
  */

  const handleKeyDown = (index, event) => {
    if (verificationState === 'success') {
      event.preventDefault();

      return;
    }

    /*
     * Backspace
     */
    if (event.key === 'Backspace') {
      event.preventDefault();

      clearErrorState();

      /*
       * خانه فعلی مقدار دارد:
       * همان را پاک کن.
       */
      if (digits[index]) {
        setDigits((previous) => {
          const next = [...previous];

          next[index] = '';

          return next;
        });

        return;
      }

      /*
       * خانه فعلی خالی است:
       * به خانه قبلی برگرد.
       */
      if (index > 0) {
        const previousIndex = index - 1;

        setDigits((previous) => {
          const next = [...previous];

          next[previousIndex] = '';

          return next;
        });

        requestAnimationFrame(() => {
          inputRefs.current[previousIndex]?.focus();
        });
      }

      return;
    }

    /*
     * چون UI فارسی است و مجموعه
     * flex-row-reverse دارد:
     *
     * ArrowLeft = رقم بعدی
     * ArrowRight = رقم قبلی
     */

    if (event.key === 'ArrowLeft' && index < OTP_LENGTH - 1) {
      event.preventDefault();

      inputRefs.current[index + 1]?.focus();

      return;
    }

    if (event.key === 'ArrowRight' && index > 0) {
      event.preventDefault();

      inputRefs.current[index - 1]?.focus();

      return;
    }

    /*
     * Enter
     */
    if (event.key === 'Enter' && isComplete) {
      event.preventDefault();

      loginHandle();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Resend OTP
  |--------------------------------------------------------------------------
  */

  const tryAgainHandle = async () => {
    if (isResending || verificationState === 'success') {
      return;
    }

    setIsResending(true);

    setVerificationState('idle');

    setErrorMessage('');

    setDigits(Array(OTP_LENGTH).fill(''));

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

      if (!data.success) {
        toast.showErrorToast(data.error || 'ارسال مجدد کد ناموفق بود.');

        return;
      }

      /*
       * challengeId جدید
       */
      setOtpToken(data.challengeId);

      /*
       * Reset صریح Timer.
       *
       * حتی اگر Backend به هر دلیل
       * همان challengeId قبلی را
       * برگرداند.
       */
      setTimerCycle((previous) => previous + 1);

      toast.showSuccessToast('کد جدید ارسال شد.');

      window.setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    } catch (error) {
      console.error('[RESEND_OTP_ERROR]', error);

      toast.showErrorToast('خطا در ارتباط با سرور.');
    } finally {
      setIsResending(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Login Handler
  |--------------------------------------------------------------------------
  */

  const loginHandle = useCallback(
    async (codeOverride = null) => {
      /*
       * Auto Submit و Button
       * همزمان Request نسازند.
       */
      if (submitLockRef.current) {
        return;
      }

      if (verificationState === 'success') {
        return;
      }

      const code = normalizeDigits(codeOverride ?? confirmCode).slice(
        0,
        OTP_LENGTH
      );

      /*
       * OTP ناقص
       */
      if (code.length !== OTP_LENGTH) {
        setVerificationState('error');

        setErrorMessage('کد تأیید باید ۵ رقمی باشد.');

        return;
      }

      /*
       * Token وجود ندارد
       */
      if (!otpToken) {
        toast.showErrorToast(
          'درخواست تأیید معتبر نیست. دوباره کد دریافت کنید.'
        );

        return;
      }

      submitLockRef.current = true;

      setIsSubmitting(true);

      setVerificationState('idle');

      setErrorMessage('');

      try {
        const login = await loginOtp({
          phone,

          code,

          challengeId: otpToken,

          username: username || null,
        });

        /*
         * =====================
         * Invalid OTP
         * =====================
         */

        if (login.meta.requestStatus !== 'fulfilled') {
          const message = login.payload || 'کد تأیید نامعتبر یا منقضی شده است.';

          setVerificationState('error');

          setErrorMessage(message);

          toast.showErrorToast(message);

          /*
           * Timer اینجا اصلاً
           * Reset نمی‌شود.
           */

          return;
        }

        /*
         * =====================
         * Success
         * =====================
         */

        /*
         * موقعیت واقعی مربع‌ها
         * را قبل از Animation
         * محاسبه کن.
         */
        prepareSuccessMerge();

        /*
         * Start animation.
         */
        setVerificationState('success');

        /*
         * Keyboard را ببند.
         */
        inputRefs.current.forEach((input) => {
          input?.blur();
        });

        /*
         * اطلاعات User/Cart
         */
        await loadUser();

        await fetchCart();

        toast.showSuccessToast(
          username
            ? 'ثبت‌نام و ورود با موفقیت انجام شد.'
            : 'با موفقیت وارد شدید.'
        );

        /*
         * مقصد قبل از Login
         */
        const previousPage = sessionStorage.getItem('previousPage') || '/';

        sessionStorage.removeItem('previousPage');

        /*
         * فرصت نمایش کامل:
         *
         * Merge
         * Fade
         * Green Square
         * Checkmark
         */
        await sleep(SUCCESS_REDIRECT_DELAY);

        clearForm();

        router.replace(previousPage);
      } catch (error) {
        console.error('[OTP_LOGIN_ERROR]', error);

        setVerificationState('error');

        setErrorMessage('خطا در ارتباط با سرور.');

        toast.showErrorToast('خطا در ارتباط با سرور.');
      } finally {
        setIsSubmitting(false);

        submitLockRef.current = false;
      }
    },
    [
      verificationState,
      confirmCode,
      otpToken,
      phone,
      username,
      loginOtp,
      loadUser,
      fetchCart,
      toast,
      prepareSuccessMerge,
      clearForm,
      router,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Auto submit
  |--------------------------------------------------------------------------
  |
  | وقتی تمام ۵ رقم پر شود:
  |
  | Typing
  | Paste
  | OTP Autofill
  |
  | همگی به صورت خودکار loginHandle
  | را اجرا می‌کنند.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !isComplete ||
      isSubmitting ||
      verificationState !== 'idle' ||
      !otpToken
    ) {
      return undefined;
    }

    /*
     * تأخیر بسیار کوتاه برای اینکه
     * رقم پنجم ابتدا در UI دیده شود.
     */
    const timeout = window.setTimeout(() => {
      loginHandle(digits.join(''));
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    digits,
    isComplete,
    isSubmitting,
    verificationState,
    otpToken,
    loginHandle,
  ]);

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

      {/* Ambient glow */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute right-[-12rem] top-[-10rem] h-[36rem] w-[36rem] rounded-full bg-secondary/[0.08] blur-[120px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/[0.10] pointer-events-none absolute bottom-[-14rem] left-[-10rem] h-[34rem] w-[34rem] rounded-full blur-[120px]'
      />

      <div className='relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[1440px] items-center px-4 py-5 sm:px-6 sm:py-8 lg:px-8'>
        <div className='grid w-full overflow-hidden rounded-[32px] border border-black/[0.05] bg-surface-light/80 shadow-[0_35px_100px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:min-h-[720px] lg:grid-cols-[0.92fr_1.08fr] dark:border-white/10 dark:bg-surface-dark/75 dark:shadow-[0_35px_100px_rgba(0,0,0,0.30)]'>
          {/* =====================================================
              OTP FORM
          ====================================================== */}

          <section className='relative order-2 flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:order-1 lg:px-12 xl:px-16'>
            <div
              aria-hidden='true'
              className='bg-yellow/[0.08] pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-[90px]'
            />

            <div className='relative z-10 w-full max-w-[460px]'>
              {/* Mobile Logo */}
              <div className='mb-7 flex justify-center lg:hidden'>
                <Link href='/' aria-label='سمانه یوگا'>
                  <Logo />
                </Link>
              </div>

              {/* Badge */}
              <SiteBadge variant='secondary' size='sm'>
                <span className='flex items-center gap-1.5'>
                  <HiOutlineShieldCheck size={14} />
                  تأیید هویت امن
                </span>
              </SiteBadge>

              {/* Title */}
              <h1 className='mt-4 text-2xl font-black leading-[1.7] text-text-light sm:text-3xl dark:text-text-dark'>
                کد تأیید را
                <span className='mr-2 text-secondary'>وارد کنید</span>
              </h1>

              <p className='mt-2 text-xs leading-7 text-subtext-light sm:text-sm sm:leading-8 dark:text-subtext-dark'>
                کد ۵ رقمی ارسال‌شده برای شماره زیر را وارد کنید.
              </p>

              {/* =================================================
                  PHONE
              ================================================== */}

              <div className='mt-5 flex items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-background-light/50 px-4 py-3 dark:border-white/10 dark:bg-background-dark/30'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                    <HiOutlineDevicePhoneMobile size={18} />
                  </span>

                  <div className='min-w-0'>
                    <p className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                      شماره موبایل
                    </p>

                    <strong
                      dir='ltr'
                      className='mt-0.5 block truncate font-faNa text-sm font-black tracking-wide text-text-light dark:text-text-dark'
                    >
                      {toPersianDigits(phone)}
                    </strong>
                  </div>
                </div>

                <button
                  type='button'
                  disabled={verificationState === 'success'}
                  onClick={backwardHandle}
                  className='flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-black text-secondary transition-colors hover:bg-secondary/10 disabled:pointer-events-none disabled:opacity-50'
                >
                  <HiOutlinePencilSquare size={15} />
                  ویرایش
                </button>
              </div>

              {/* =================================================
                  TIMER
              ================================================== */}

              <div className='relative mt-6 overflow-hidden rounded-[24px] border border-secondary/10 bg-secondary/[0.045] px-4 py-5 text-center'>
                <div
                  aria-hidden='true'
                  className='pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-secondary/10 blur-[55px]'
                />

                {!isFinished ? (
                  <div className='relative z-10'>
                    <p className='text-[9px] font-bold text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                      زمان باقی‌مانده برای استفاده از کد
                    </p>

                    <div
                      dir='ltr'
                      className='mt-4 font-faNa text-[42px] font-black leading-none tracking-[0.06em] text-secondary sm:text-[48px]'
                    >
                      {toPersianDigits(time)}
                    </div>

                    <div className='mx-auto mt-4 h-1.5 w-full max-w-[270px] overflow-hidden rounded-full bg-secondary/10'>
                      <div
                        className='h-full rounded-full bg-secondary transition-[width] duration-300 ease-linear'
                        style={{
                          width: `${timerProgress}%`,
                        }}
                      />
                    </div>

                    <p className='mt-2 text-[9px] text-subtext-light dark:text-subtext-dark'>
                      بعد از پایان زمان می‌توانید کد جدید دریافت کنید.
                    </p>
                  </div>
                ) : (
                  <div className='relative z-10 py-1'>
                    <p className='text-xs font-black text-text-light dark:text-text-dark'>
                      زمان کد به پایان رسیده است
                    </p>

                    <p className='mt-1 text-[10px] text-subtext-light dark:text-subtext-dark'>
                      برای ادامه یک کد جدید دریافت کنید.
                    </p>

                    <SiteButton
                      type='button'
                      variant='outline'
                      size='sm'
                      disabled={isResending}
                      onClick={tryAgainHandle}
                      className='mt-3'
                    >
                      {isResending ? 'در حال ارسال...' : 'دریافت مجدد کد'}
                    </SiteButton>
                  </div>
                )}
              </div>

              {/* =================================================
                  OTP BOXES
              ================================================== */}

              <motion.div
                ref={otpGroupRef}
                className='relative mx-auto mt-8 flex w-fit flex-row-reverse items-center justify-center gap-2'
                animate={
                  verificationState === 'error'
                    ? {
                        x: [0, -9, 8, -7, 6, -4, 3, 0],
                      }
                    : {
                        x: 0,
                      }
                }
                transition={
                  verificationState === 'error'
                    ? {
                        duration: 0.38,

                        ease: 'easeInOut',
                      }
                    : {
                        duration: 0.15,
                      }
                }
              >
                {digits.map((digit, index) => (
                  <motion.div
                    key={index}
                    className='relative'
                    animate={
                      verificationState === 'success'
                        ? {
                            /*
                             * هر مربع دقیقاً
                             * به مرکز واقعی
                             * مجموعه می‌رود.
                             */
                            x: mergeOffsets[index] || 0,

                            /*
                             * هنگام نزدیک شدن
                             * به مرکز کوچک و
                             * محو می‌شود.
                             */
                            scale: [1, 1, 0.88, 0.62],

                            opacity: [1, 1, 0.4, 0],
                          }
                        : {
                            x: 0,
                            scale: 1,
                            opacity: 1,
                          }
                    }
                    transition={
                      verificationState === 'success'
                        ? {
                            duration: 0.64,

                            times: [0, 0.45, 0.78, 1],

                            ease: [0.22, 1, 0.36, 1],
                          }
                        : {
                            duration: 0.2,
                          }
                    }
                  >
                    <input
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9۰-۹٠-٩]*'
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      value={toPersianDigits(digit)}
                      disabled={isSubmitting || verificationState === 'success'}
                      aria-label={`رقم ${index + 1} کد تأیید`}
                      onChange={(event) => handleChange(index, event)}
                      onPaste={(event) => handlePaste(index, event)}
                      onKeyDown={(event) => handleKeyDown(index, event)}
                      onFocus={(event) => {
                        event.target.select();
                      }}
                      className={`h-[58px] w-[58px] rounded-[17px] border-2 bg-background-light/70 text-center font-faNa text-2xl font-black outline-none transition-[border-color,background-color,box-shadow,color] duration-200 disabled:cursor-default sm:h-[60px] sm:w-[60px] dark:bg-background-dark/45 ${
                        verificationState === 'error'
                          ? 'border-red bg-red/[0.035] text-red shadow-[0_0_0_4px_rgba(239,68,68,0.07)]'
                          : verificationState === 'success'
                            ? 'border-green-light bg-green-light/[0.06] text-green-light shadow-[0_0_0_4px_rgba(34,197,94,0.08)]'
                            : digit
                              ? 'border-secondary bg-secondary/[0.045] text-text-light shadow-[0_0_0_4px_rgba(38,145,125,0.06)] dark:text-text-dark'
                              : 'border-black/[0.07] text-text-light hover:border-secondary/25 focus:border-secondary focus:shadow-[0_0_0_4px_rgba(38,145,125,0.08)] dark:border-white/10 dark:text-text-dark'
                      }`}
                    />
                  </motion.div>
                ))}

                {/* ===============================================
                    SUCCESS MERGED BOX
                ================================================ */}

                {verificationState === 'success' && (
                  <div className='pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2'>
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.55,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      transition={{
                        /*
                         * ابتدا مربع‌ها تقریباً
                         * به مرکز می‌رسند و
                         * Fade می‌شوند.
                         */
                        delay: 0.52,

                        duration: 0.34,

                        type: 'spring',

                        stiffness: 300,

                        damping: 18,
                      }}
                      className='flex h-[62px] w-[62px] items-center justify-center rounded-[18px] border-2 border-green-light bg-surface-light text-green-light shadow-[0_15px_45px_rgba(34,197,94,0.22)] dark:bg-surface-dark'
                    >
                      <motion.div
                        initial={{
                          scale: 0,
                          rotate: -25,
                        }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                        }}
                        transition={{
                          delay: 0.64,

                          type: 'spring',

                          stiffness: 420,

                          damping: 16,
                        }}
                      >
                        <HiOutlineCheck size={34} strokeWidth={2.5} />
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </motion.div>

              {/* =================================================
                  MESSAGE
              ================================================== */}

              <div className='mt-3 min-h-6 text-center'>
                {verificationState === 'error' && errorMessage && (
                  <motion.p
                    initial={{
                      opacity: 0,

                      y: -4,
                    }}
                    animate={{
                      opacity: 1,

                      y: 0,
                    }}
                    className='text-[10px] font-bold text-red sm:text-xs'
                  >
                    {errorMessage}
                  </motion.p>
                )}

                {verificationState === 'success' && (
                  <motion.p
                    initial={{
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.65,
                    }}
                    className='text-[10px] font-black text-green-light sm:text-xs'
                  >
                    کد با موفقیت تأیید شد
                  </motion.p>
                )}
              </div>

              {/* =================================================
                  CONFIRM BUTTON
              ================================================== */}

              <SiteButton
                type='button'
                variant='primary'
                size='lg'
                endIcon={HiOutlineArrowLeft}
                disabled={
                  !isComplete || isSubmitting || verificationState === 'success'
                }
                onClick={() => loginHandle()}
                className='mt-3 w-full'
              >
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    در حال تأیید...
                  </span>
                ) : verificationState === 'success' ? (
                  'تأیید شد'
                ) : (
                  'تأیید کد'
                )}
              </SiteButton>

              {/* =================================================
                  EDIT PHONE
              ================================================== */}

              <button
                type='button'
                disabled={verificationState === 'success'}
                onClick={backwardHandle}
                className='mx-auto mt-4 flex items-center gap-1.5 text-[10px] font-bold text-subtext-light transition-colors hover:text-secondary disabled:pointer-events-none disabled:opacity-40 sm:text-xs dark:text-subtext-dark'
              >
                <HiOutlineArrowRight size={15} />
                شماره اشتباه است؟
                <span className='font-black text-secondary'>ویرایش شماره</span>
              </button>

              {/* Security */}
              <div className='mt-6 flex items-center justify-center gap-1.5 text-center text-[9px] leading-5 text-subtext-light dark:text-subtext-dark'>
                <HiOutlineLockClosed
                  size={13}
                  className='shrink-0 text-secondary'
                />
                کد ورود محرمانه است؛ آن را در اختیار دیگران قرار ندهید.
              </div>
            </div>
          </section>

          {/* =====================================================
              BRAND PANEL
          ====================================================== */}

          <section className='relative order-1 hidden overflow-hidden border-r border-black/[0.04] lg:flex dark:border-white/10'>
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

            {/* Abstract Shield */}
            <div
              aria-hidden='true'
              className='pointer-events-none absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 opacity-[0.065]'
            >
              <HiOutlineShieldCheck
                size={390}
                strokeWidth={0.65}
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
                  ورود امن
                </SiteBadge>
              </div>

              {/* Content */}
              <div className='max-w-xl'>
                <p className='text-xs font-black text-secondary'>
                  فقط یک قدم باقی مانده
                </p>

                <h2 className='mt-3 text-3xl font-black leading-[1.8] text-text-light xl:text-[38px] dark:text-text-dark'>
                  چند ثانیه تا ادامه مسیر
                  <span className='mr-2 text-secondary'>تمرین شما</span>
                </h2>

                <p className='mt-3 max-w-md text-sm leading-8 text-subtext-light dark:text-subtext-dark'>
                  کد ارسال‌شده را تأیید کنید تا به دوره‌ها، جلسات و فضای شخصی
                  خود در سمانه یوگا برگردید.
                </p>

                <div className='mt-7 grid grid-cols-2 gap-3'>
                  <AuthFeature
                    icon={HiOutlineKey}
                    title='کد یکبار مصرف'
                    description='ورود بدون نیاز به رمز عبور'
                  />

                  <AuthFeature
                    icon={HiOutlineShieldCheck}
                    title='ورود امن'
                    description='تأیید مستقیم شماره موبایل'
                  />

                  <AuthFeature
                    icon={HiOutlinePlayCircle}
                    title='ادامه تمرین'
                    description='بازگشت سریع به جلسات'
                  />

                  <AuthFeature
                    icon={HiOutlineAcademicCap}
                    title='دوره‌های شما'
                    description='دسترسی به مسیر یادگیری'
                  />
                </div>
              </div>

              {/* Footer */}
              <div className='flex items-center gap-2 text-[10px] text-subtext-light dark:text-subtext-dark'>
                <span className='flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
                  <HiOutlineSparkles size={16} />
                </span>
                ورود ساده، امن و بدون رمز عبور
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
| Auth Feature
|--------------------------------------------------------------------------
*/

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

export default ConfirmCodeContent;
