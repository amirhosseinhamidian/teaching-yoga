/* eslint-disable no-undef */
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PageTitle from '@/components/Ui/PageTitle/PageTitle';
import { MdOutlineAddAPhoto } from 'react-icons/md';
import { getShamsiDate } from '@/utils/dateTimeHelper';
import Image from 'next/image';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthUser } from '@/hooks/auth/useAuthUser';
import { useUserActions } from '@/hooks/auth/useUserActions';
import Link from 'next/link';

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

// ✅ state را از تاریخ‌ها استخراج می‌کنیم (به status/state برگشتی API وابسته نیستیم)
function normalizeSubState(sub) {
  const now = Date.now();
  const start = new Date(sub?.startDate).getTime();
  const end = new Date(sub?.endDate).getTime();

  // شروع در آینده => در انتظار فعال‌سازی
  if (Number.isFinite(start) && start > now) return 'PENDING_START';

  // پایان در آینده => فعال
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

  // ✅ Subscription states
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState('');
  const [activeSubs, setActiveSubs] = useState([]);
  const [accessibleCourses, setAccessibleCourses] = useState([]);

  const handleDivClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    setLoadingUpload(true);
    const file = event.target.files?.[0];

    if (!file) {
      setLoadingUpload(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', 'images/avatars');
    formData.append('fileName', user.id);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/image`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        toast.showErrorToast('خطا در آپلود تصویر');
        return;
      }

      const avatarUrl = await response.json();

      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}/update-avatar`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: avatarUrl.fileUrl }),
        }
      );

      if (!updateResponse.ok) {
        toast.showErrorToast('خطا در ثبت آواتار');
        return;
      }

      await loadUser();
      toast.showSuccessToast('آواتار با موفقیت آپلود شد');
    } catch (error) {
      console.error('avatar upload error: ', error);
      toast.showErrorToast('خطا در آپلود');
    } finally {
      setLoadingUpload(false);
    }
  };

  // ✅ Fetch subscriptions summary
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

      // ✅ چند حالت مختلف برای سازگاری با API
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

  return (
    <div>
      <PageTitle>حساب کاربری</PageTitle>

      <div className='flex flex-col items-start justify-between gap-6 md:flex-row'>
        {/* Header */}
        <div className='mt-6 flex items-center gap-2'>
          <input
            type='file'
            ref={fileInputRef}
            className='hidden'
            accept='image/*'
            onChange={handleFileChange}
          />

          {user?.avatar ? (
            <div
              className='relative h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 md:cursor-pointer'
              onClick={handleDivClick}
            >
              <Image
                src={user?.avatar}
                alt={user.username}
                width={256}
                height={256}
                className={`h-14 w-14 rounded-full border border-secondary xs:h-16 xs:w-16 sm:h-20 sm:w-20 ${
                  loadingUpload ? 'opacity-50' : ''
                }`}
              />

              <div
                className={`absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black bg-opacity-55 p-1.5 ${
                  loadingUpload ? 'opacity-50' : ''
                }`}
                onClick={handleDivClick}
              >
                <MdOutlineAddAPhoto size={16} className='text-secondary' />
              </div>

              {loadingUpload && (
                <AiOutlineLoading3Quarters
                  size={34}
                  className='absolute left-2.5 top-2.5 animate-spin text-secondary xs:left-4 xs:top-4 sm:left-6 sm:top-6'
                />
              )}
            </div>
          ) : (
            <div
              className='flex h-14 w-14 items-center justify-center rounded-full border border-secondary bg-surface-light p-2 xs:h-16 xs:w-16 sm:h-20 sm:w-20 md:cursor-pointer dark:bg-surface-dark'
              onClick={handleDivClick}
            >
              {loadingUpload ? (
                <AiOutlineLoading3Quarters
                  size={34}
                  className='animate-spin text-secondary'
                />
              ) : (
                <MdOutlineAddAPhoto size={34} className='text-secondary' />
              )}
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <span className='whitespace-nowrap text-sm font-semibold xs:text-lg'>
              {user?.firstname && user?.lastname
                ? `${user.firstname} ${user.lastname}`
                : user?.username}
            </span>
            <span className='font-faNa text-2xs text-subtext-light xs:text-sm dark:text-subtext-dark'>
              {`تاریخ عضویت: ${getShamsiDate(user?.createAt)}`}
            </span>
          </div>
        </div>

        {/* ✅ Subscription section */}
        <div className='mt-6 min-w-[320px] rounded-2xl bg-surface-light p-4 dark:bg-surface-dark'>
          <div className='flex items-center justify-between gap-2'>
            <h3 className='text-sm font-semibold'>اشتراک شما</h3>

            <Link href='/subscriptions' className='text-xs text-secondary'>
              مشاهده پلن‌ها
            </Link>
          </div>

          {subsLoading ? (
            <div className='mt-4 flex items-center gap-2 text-sm'>
              <AiOutlineLoading3Quarters className='animate-spin' />
              در حال دریافت اطلاعات اشتراک...
            </div>
          ) : subsError ? (
            <div className='mt-4 text-sm text-red'>{subsError}</div>
          ) : !hasActiveSubscription ? (
            <div className='mt-4 text-sm text-subtext-light dark:text-subtext-dark'>
              در حال حاضر اشتراک فعال ندارید.
            </div>
          ) : (
            <div className='mt-4 space-y-3'>
              {/* Active/Pending subscriptions list */}
              <div className='space-y-2'>
                {activeSubs.map((s) => {
                  const state = s?.state || normalizeSubState(s);

                  const badge =
                    state === 'ACTIVE_NOW'
                      ? {
                          text: 'فعال',
                          cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-200',
                        }
                      : {
                          text: 'در انتظار فعال‌سازی',
                          cls: 'bg-amber-100 text-amber-700 dark:bg-amber-200',
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
                      className='rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-background-dark'
                    >
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <p className='text-sm font-semibold'>
                            {s?.plan?.name || 'اشتراک'}
                          </p>

                          {state === 'PENDING_START' ? (
                            <p className='mt-1 font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
                              شروع: {toFaDate(s.startDate)} • {remainingDays}{' '}
                              روز تا شروع
                            </p>
                          ) : (
                            <p className='mt-1 font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
                              پایان: {toFaDate(s.endDate)} • {remainingDays} روز
                              باقی‌مانده
                            </p>
                          )}
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${badge.cls}`}
                        >
                          {badge.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Accessible courses */}
              <div className='border-t border-slate-200 pt-3 dark:border-slate-700'>
                <p className='mb-2 text-xs font-semibold'>
                  دوره‌هایی که با اشتراک می‌توانید ببینید:
                </p>

                {accessibleCourses.length === 0 ? (
                  <p className='text-xs text-subtext-light dark:text-subtext-dark'>
                    این اشتراک فعلاً دوره‌ای ندارد.
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {accessibleCourses.map((c) => (
                      <Link
                        key={c.id}
                        href={`/courses/${c.shortAddress}`}
                        className='flex min-w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 transition-all duration-150 ease-in hover:border-secondary dark:border-slate-700 dark:bg-background-dark'
                      >
                        <Image
                          src={c.cover}
                          alt={c.title}
                          width={96}
                          height={72}
                          className='h-10 w-14 rounded-md object-cover'
                        />
                        <span className='line-clamp-2 text-xs'>{c.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
