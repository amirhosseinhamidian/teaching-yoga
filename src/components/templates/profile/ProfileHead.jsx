/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { getShamsiDate } from '@/utils/dateTimeHelper';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCalendarDays,
  HiOutlineCamera,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineUserCircle,
} from 'react-icons/hi2';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

function toFaDate(d) {
  try {
    return new Date(d).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '-';
  }
}

function calcDays(fromMs, toMs) {
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 0;
  return Math.max(0, Math.ceil((toMs - fromMs) / (1000 * 60 * 60 * 24)));
}

function normalizeSubState(sub) {
  const now = Date.now();
  const start = new Date(sub?.startDate).getTime();
  const end = new Date(sub?.endDate).getTime();

  if (Number.isFinite(start) && start > now) return 'PENDING_START';
  if (Number.isFinite(end) && end >= now) return 'ACTIVE_NOW';

  return 'EXPIRED';
}

function buildActiveSubs(subsArr) {
  return (Array.isArray(subsArr) ? subsArr : [])
    .map((s) => ({ ...s, state: normalizeSubState(s) }))
    .filter((s) => s.state === 'ACTIVE_NOW' || s.state === 'PENDING_START');
}

export default function ProfileHead() {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const { user } = useAuthUser();
  const { loadUser } = useUserActions();

  const [loadingUpload, setLoadingUpload] = useState(false);
  const fileInputRef = useRef(null);

  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState('');
  const [activeSubs, setActiveSubs] = useState([]);
  const [accessibleCourses, setAccessibleCourses] = useState([]);

  const handleDivClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * validation اولیه سمت client
     * فقط برای UX است.
     *
     * validation اصلی همچنان
     * سمت API انجام می‌شود.
     */
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.showErrorToast('فقط تصاویر JPG، PNG، GIF و WebP مجاز هستند.');

      event.target.value = '';

      return;
    }

    const maxSize = 20 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.showErrorToast('حجم تصویر نباید بیشتر از ۲۰ مگابایت باشد.');

      event.target.value = '';

      return;
    }

    setLoadingUpload(true);

    try {
      const formData = new FormData();

      /*
       * فقط خود فایل ارسال می‌شود.
       *
       * userId، folderPath و fileName
       * را server مشخص می‌کند.
       */
      formData.append('file', file);

      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,

        /*
         * برای اطمینان از ارسال
         * cookie/session.
         */
        credentials: 'include',
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('avatar upload failed:', {
          status: response.status,

          result,
        });

        toast.showErrorToast(result?.error || 'خطا در آپلود تصویر');

        return;
      }

      /*
       * اطلاعات user را دوباره
       * از server دریافت کن.
       */
      await loadUser();

      toast.showSuccessToast(result?.message || 'آواتار با موفقیت آپلود شد');
    } catch (error) {
      console.error('avatar upload error:', error);

      toast.showErrorToast('خطا در ارتباط با سرور');
    } finally {
      setLoadingUpload(false);

      /*
       * ضروری برای اینکه کاربر بتواند
       * همان فایل را دوباره انتخاب کند.
       */
      event.target.value = '';
    }
  };

  const fetchMySubs = async () => {
    setSubsLoading(true);
    setSubsError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/subscriptions`,
        { method: 'GET', cache: 'no-store' }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubsError(data?.error || 'خطا در دریافت اطلاعات اشتراک');
        setActiveSubs([]);
        setAccessibleCourses([]);
        return;
      }

      const payload = data?.data || {};

      const rawSubs =
        (Array.isArray(payload.activeSubscriptions) &&
          payload.activeSubscriptions) ||
        (Array.isArray(payload.subscriptions) && payload.subscriptions) ||
        [];

      const normalizedActive = buildActiveSubs(rawSubs);
      setActiveSubs(normalizedActive);

      setAccessibleCourses(
        Array.isArray(payload.accessibleCourses)
          ? payload.accessibleCourses
          : []
      );
    } catch (e) {
      console.error(e);
      setSubsError('خطا در ارتباط با سرور');
      setActiveSubs([]);
      setAccessibleCourses([]);
    } finally {
      setSubsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchMySubs();
  }, [user?.id]);

  const hasActiveSubscription = useMemo(() => {
    return Array.isArray(activeSubs) && activeSubs.length > 0;
  }, [activeSubs]);

  const displayName =
    user?.firstname && user?.lastname
      ? `${user.firstname} ${user.lastname}`
      : user?.username;

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className='relative mt-5 overflow-hidden p-4 sm:p-5 lg:p-6'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-secondary/10 blur-[95px]'
      />

      <div
        aria-hidden='true'
        className='bg-yellow/10 pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full blur-[100px]'
      />

      <div className='relative z-10 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-stretch'>
        {/* User identity */}
        <div className='flex min-w-0 flex-col justify-between rounded-[24px] border border-black/5 bg-background-light/50 p-4 sm:p-5 dark:border-white/10 dark:bg-background-dark/35'>
          <div className='flex items-center gap-4'>
            <input
              type='file'
              ref={fileInputRef}
              className='hidden'
              accept='image/*'
              onChange={handleFileChange}
            />

            <button
              type='button'
              onClick={handleDivClick}
              aria-label='تغییر تصویر پروفایل'
              className='group relative h-[78px] w-[78px] shrink-0 overflow-hidden rounded-[24px] border border-secondary/15 bg-secondary/10 shadow-[0_16px_38px_rgba(38,145,125,0.12)] sm:h-[92px] sm:w-[92px]'
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user?.username || 'پروفایل کاربر'}
                  fill
                  sizes='92px'
                  className={`object-cover transition duration-300 group-hover:scale-105 ${
                    loadingUpload ? 'opacity-45' : ''
                  }`}
                />
              ) : (
                <span className='absolute inset-0 flex items-center justify-center text-secondary'>
                  <HiOutlineUserCircle size={42} />
                </span>
              )}

              <span className='absolute bottom-1.5 left-1.5 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-105'>
                <HiOutlineCamera size={17} />
              </span>

              {loadingUpload && (
                <span className='absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]'>
                  <AiOutlineLoading3Quarters
                    size={28}
                    className='animate-spin text-white'
                  />
                </span>
              )}
            </button>

            <div className='min-w-0'>
              <SiteBadge variant='secondary' size='sm'>
                <span className='flex items-center gap-1.5'>
                  <HiOutlineSparkles size={14} />
                  پروفایل شما
                </span>
              </SiteBadge>

              <h2 className='mt-2 truncate text-lg font-black text-text-light sm:text-xl dark:text-text-dark'>
                {displayName || 'کاربر سمانه یوگا'}
              </h2>

              <div className='mt-2 flex items-center gap-2 text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                <HiOutlineCalendarDays size={15} className='text-secondary' />
                <span>تاریخ عضویت:</span>
                <span className='font-faNa font-bold'>
                  {getShamsiDate(user?.createAt)}
                </span>
              </div>
            </div>
          </div>

          <div className='mt-5 grid grid-cols-2 gap-2'>
            <div className='rounded-2xl border border-black/5 bg-surface-light/65 p-3 dark:border-white/10 dark:bg-surface-dark/55'>
              <p className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                وضعیت اشتراک
              </p>
              <p className='mt-1 text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                {subsLoading
                  ? 'در حال بررسی...'
                  : hasActiveSubscription
                    ? 'اشتراک فعال'
                    : 'بدون اشتراک فعال'}
              </p>
            </div>

            <div className='rounded-2xl border border-black/5 bg-surface-light/65 p-3 dark:border-white/10 dark:bg-surface-dark/55'>
              <p className='text-[10px] text-subtext-light dark:text-subtext-dark'>
                دوره‌های اشتراکی
              </p>
              <p className='mt-1 font-faNa text-sm font-black text-secondary'>
                {Number(accessibleCourses.length || 0).toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className='rounded-[24px] border border-black/5 bg-surface-light/55 p-4 sm:p-5 dark:border-white/10 dark:bg-surface-dark/50'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <HiOutlineAcademicCap size={23} />
              </span>

              <div>
                <p className='text-[10px] font-bold text-secondary'>
                  دسترسی آموزشی
                </p>
                <h3 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                  اشتراک شما
                </h3>
              </div>
            </div>

            <Link
              href='/subscriptions'
              className='group inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-secondary/15 bg-secondary/5 px-3 text-[10px] font-bold text-secondary transition-all hover:bg-secondary/10 sm:text-xs'
            >
              مشاهده پلن‌ها
              <HiOutlineArrowLeft
                size={14}
                className='transition-transform group-hover:-translate-x-0.5'
              />
            </Link>
          </div>

          {subsLoading ? (
            <div className='mt-5 flex min-h-[130px] items-center justify-center gap-2 rounded-2xl bg-background-light/40 text-xs text-subtext-light dark:bg-background-dark/30 dark:text-subtext-dark'>
              <AiOutlineLoading3Quarters className='animate-spin text-secondary' />
              در حال دریافت اطلاعات اشتراک...
            </div>
          ) : subsError ? (
            <div className='mt-5 rounded-2xl border border-red/15 bg-red/5 p-4 text-xs leading-6 text-red'>
              {subsError}
            </div>
          ) : !hasActiveSubscription ? (
            <div className='mt-5 flex min-h-[130px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-background-light/35 px-4 text-center dark:border-white/10 dark:bg-background-dark/25'>
              <HiOutlineClock size={28} className='text-secondary/60' />
              <p className='mt-3 text-xs font-bold text-text-light dark:text-text-dark'>
                در حال حاضر اشتراک فعال ندارید
              </p>
              <p className='mt-1 text-[10px] leading-5 text-subtext-light dark:text-subtext-dark'>
                با تهیه اشتراک می‌توانید به دوره‌های موجود در پلن انتخابی دسترسی
                داشته باشید.
              </p>
            </div>
          ) : (
            <div className='mt-5 space-y-4'>
              <div className='grid gap-2 sm:grid-cols-2'>
                {activeSubs.map((s) => {
                  const state = s?.state || normalizeSubState(s);

                  const badge =
                    state === 'ACTIVE_NOW'
                      ? {
                          text: 'فعال',
                          cls: 'border-secondary/15 bg-secondary/10 text-secondary',
                        }
                      : {
                          text: 'در انتظار فعال‌سازی',
                          cls: 'border-yellow/20 bg-yellow/10 text-yellow',
                        };

                  const now = Date.now();
                  const startMs = new Date(s.startDate).getTime();
                  const endMs = new Date(s.endDate).getTime();

                  const remainingDays =
                    state === 'PENDING_START'
                      ? calcDays(now, startMs)
                      : calcDays(now, endMs);

                  return (
                    <div
                      key={s.id}
                      className='rounded-2xl border border-black/5 bg-background-light/45 p-3.5 dark:border-white/10 dark:bg-background-dark/30'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <p className='truncate text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                            {s?.plan?.name || 'اشتراک'}
                          </p>

                          <p className='mt-1.5 font-faNa text-[10px] leading-5 text-subtext-light dark:text-subtext-dark'>
                            {state === 'PENDING_START'
                              ? `شروع: ${toFaDate(s.startDate)} • ${remainingDays} روز تا شروع`
                              : `پایان: ${toFaDate(s.endDate)} • ${remainingDays} روز باقی‌مانده`}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-xl border px-2 py-1 text-[9px] font-bold ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className='border-t border-black/5 pt-4 dark:border-white/10'>
                <div className='mb-3 flex items-center justify-between gap-2'>
                  <p className='text-[11px] font-black text-text-light sm:text-xs dark:text-text-dark'>
                    دوره‌های قابل مشاهده با اشتراک
                  </p>

                  <span className='rounded-lg bg-secondary/10 px-2 py-1 font-faNa text-[9px] font-black text-secondary'>
                    {accessibleCourses.length.toLocaleString('fa-IR')} دوره
                  </span>
                </div>

                {accessibleCourses.length === 0 ? (
                  <p className='rounded-xl bg-background-light/40 p-3 text-[10px] text-subtext-light dark:bg-background-dark/30 dark:text-subtext-dark'>
                    این اشتراک فعلاً دوره‌ای ندارد.
                  </p>
                ) : (
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {accessibleCourses.map((c) => (
                      <Link
                        key={c.id}
                        href={`/courses/${c.shortAddress}`}
                        className='group flex min-w-0 items-center gap-2.5 rounded-2xl border border-black/5 bg-background-light/45 p-2 transition-all duration-200 hover:border-secondary/25 hover:bg-secondary/5 dark:border-white/10 dark:bg-background-dark/30'
                      >
                        <div className='relative h-11 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary/10'>
                          <Image
                            src={c.cover}
                            alt={c.title}
                            fill
                            sizes='64px'
                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                          />
                        </div>

                        <span className='line-clamp-2 min-w-0 text-[10px] font-bold leading-5 text-text-light dark:text-text-dark'>
                          {c.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteCard>
  );
}
