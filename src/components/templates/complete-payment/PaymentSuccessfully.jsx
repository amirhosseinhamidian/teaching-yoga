/* eslint-disable no-undef */
'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineHome,
  HiOutlinePhoto,
  HiOutlineReceiptPercent,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineTruck,
} from 'react-icons/hi2';

import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';
import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';

const formatToman = (value) => {
  const number = Number(value || 0);
  return `${number.toLocaleString('fa-IR')} تومان`;
};

const humanizeShopStatus = (status) => {
  const normalized = String(status || '').toUpperCase();

  switch (normalized) {
    case 'PENDING_PAYMENT':
      return 'در انتظار پرداخت';
    case 'PROCESSING':
      return 'در حال پردازش';
    case 'PACKED':
      return 'آماده‌سازی شده';
    case 'SHIPPED':
      return 'ارسال شده';
    case 'DELIVERED':
      return 'تحویل داده شده';
    case 'CANCELLED':
      return 'لغو شده';
    case 'RETURNED':
      return 'مرجوع شده';
    default:
      return status || '—';
  }
};

const humanizePaymentStatus = (status) => {
  const normalized = String(status || '').toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return 'در انتظار پرداخت';
    case 'SUCCESSFUL':
      return 'موفق';
    case 'FAILED':
      return 'ناموفق';
    default:
      return status || '—';
  }
};

const statusBadgeClass = (status) => {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'PENDING_PAYMENT') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300';
  }

  if (normalized === 'PROCESSING') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300';
  }

  if (normalized === 'PACKED') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300';
  }

  if (normalized === 'SHIPPED') {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300';
  }

  if (normalized === 'DELIVERED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300';
  }

  if (normalized === 'CANCELLED') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300';
  }

  if (normalized === 'RETURNED') {
    return 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/25 dark:bg-purple-500/10 dark:text-purple-300';
  }

  return 'border-black/5 bg-background-light/60 text-subtext-light dark:border-white/10 dark:bg-background-dark/35 dark:text-subtext-dark';
};

const paymentBadgeClass = (status) => {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'SUCCESSFUL') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300';
  }

  if (normalized === 'FAILED') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300';
  }

  if (normalized === 'PENDING') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300';
  }

  return 'border-black/5 bg-background-light/60 text-subtext-light dark:border-white/10 dark:bg-background-dark/35 dark:text-subtext-dark';
};

const StatusPill = ({ className = '', children }) => (
  <span
    className={`inline-flex min-h-8 items-center rounded-xl border px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${className}`}
  >
    {children}
  </span>
);

StatusPill.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

const MediaThumb = ({ src, alt, course = false }) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-black/5 bg-background-light/55 dark:border-white/10 dark:bg-background-dark/35 ${
        course
          ? 'h-16 w-24 rounded-2xl sm:h-20 sm:w-28'
          : 'h-16 w-16 rounded-2xl'
      }`}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={alt || 'تصویر'}
          fill
          sizes={course ? '112px' : '64px'}
          className='object-contain p-1.5'
          onError={() => setFailed(true)}
        />
      ) : (
        <div className='absolute inset-0 flex items-center justify-center text-secondary/35'>
          <HiOutlinePhoto size={22} />
        </div>
      )}
    </div>
  );
};

MediaThumb.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  course: PropTypes.bool,
};

const SectionHeader = ({ icon: Icon, eyebrow, title, badge }) => (
  <div className='flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
    <div className='flex items-center gap-3'>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
        <Icon size={20} />
      </span>

      <div>
        {eyebrow ? (
          <p className='text-[9px] font-bold text-secondary sm:text-[10px]'>
            {eyebrow}
          </p>
        ) : null}

        <h2 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
          {title}
        </h2>
      </div>
    </div>

    {badge}
  </div>
);

SectionHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  badge: PropTypes.node,
};

const PaymentSuccessfully = ({ paymentDetails, transactionId }) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const toast = useMemo(() => createToastHandler(isDark), [isDark]);

  const [shortAddressClick, setShortAddressClick] = useState('');
  const [isClickLoading, setIsClickLoading] = useState(false);

  // --------- course/subscription data ----------
  const cart = paymentDetails?.cart || {};
  const cartCourses = cart?.cartCourses || [];
  const cartSubscriptions = cart?.cartSubscriptions || [];

  const courses = useMemo(
    () => cartCourses.map((item) => item.course).filter(Boolean),
    [cartCourses]
  );

  const subscriptionPlans = useMemo(
    () =>
      cartSubscriptions.map((item) => item.subscriptionPlan).filter(Boolean),
    [cartSubscriptions]
  );

  const isOnlySubscriptionPurchase =
    subscriptionPlans.length > 0 && courses.length === 0;

  // --------- shop data ----------
  const shopOrder = paymentDetails?.shopOrder || null;
  const shopItems = shopOrder?.items || [];
  const hasShopPurchase =
    Boolean(shopOrder) && Array.isArray(shopItems) && shopItems.length > 0;

  const shopTotals = useMemo(() => {
    if (!hasShopPurchase) return null;

    const subtotal = Number(shopOrder?.subtotal || 0);
    const discountAmount = Number(shopOrder?.discountAmount || 0);
    const shippingCost = Number(shopOrder?.shippingCost || 0);
    const payableOnline = Number(shopOrder?.payableOnline || 0);

    return {
      subtotal,
      discountAmount,
      shippingCost,
      payableOnline,
    };
  }, [hasShopPurchase, shopOrder]);

  const handleCourseClick = async (shortAddress) => {
    setShortAddressClick(shortAddress);
    setIsClickLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/courses/${shortAddress}/first-session`
      );

      if (response.ok) {
        const { sessionId } = await response.json();
        router.replace(`/courses/${shortAddress}/lesson/${sessionId}`);
      } else {
        toast.showErrorToast('خطای غیرمنتظره');
      }
    } catch (error) {
      console.error(error);
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setIsClickLoading(false);
      setShortAddressClick('');
    }
  };

  const purchaseKinds = [
    courses.length > 0
      ? `${courses.length.toLocaleString('fa-IR')} دوره`
      : null,
    subscriptionPlans.length > 0
      ? `${subscriptionPlans.length.toLocaleString('fa-IR')} اشتراک`
      : null,
    hasShopPurchase
      ? `${shopItems.reduce((sum, item) => sum + Number(item.qty || 0), 0).toLocaleString('fa-IR')} محصول`
      : null,
  ].filter(Boolean);

  const TransactionCard = (
    <SiteCard
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className='relative overflow-hidden p-5 sm:p-6'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-secondary/10 blur-[75px]'
      />

      <div className='relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-secondary/10 text-secondary'>
            <HiOutlineCheckCircle size={25} />
          </span>

          <div>
            <p className='text-[9px] font-bold text-secondary sm:text-[10px]'>
              تراکنش تأیید شد
            </p>

            <h2 className='mt-1 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
              {transactionId
                ? 'خرید شما با موفقیت ثبت شد'
                : 'پرداخت با موفقیت انجام شد'}
            </h2>

            {transactionId ? (
              <p className='mt-1.5 font-faNa text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
                کد پیگیری پرداخت: {transactionId}
              </p>
            ) : null}
          </div>
        </div>

        {purchaseKinds.length > 0 ? (
          <div className='flex flex-wrap gap-2'>
            {purchaseKinds.map((item) => (
              <SiteBadge key={item} variant='secondary' size='sm'>
                {item}
              </SiteBadge>
            ))}
          </div>
        ) : null}
      </div>
    </SiteCard>
  );

  // فقط اشتراک و بدون خرید فروشگاه
  if (isOnlySubscriptionPurchase && !hasShopPurchase) {
    const plan = subscriptionPlans[0];

    return (
      <div className='mt-6 space-y-5'>
        {TransactionCard}

        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='relative overflow-hidden p-5 sm:p-6'
        >
          <div
            aria-hidden='true'
            className='bg-yellow/10 pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-[75px]'
          />

          <div className='relative z-10'>
            <SectionHeader
              icon={HiOutlineSparkles}
              eyebrow='اشتراک فعال شد'
              title='جزئیات اشتراک شما'
              badge={
                <SiteBadge variant='yellow' size='sm'>
                  فعال
                </SiteBadge>
              }
            />

            {plan ? (
              <div className='mt-5 rounded-[22px] border border-secondary/15 bg-secondary/[0.05] p-4 sm:p-5 dark:bg-secondary/[0.08]'>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <p className='text-[9px] font-bold text-subtext-light dark:text-subtext-dark'>
                      پلن انتخابی
                    </p>
                    <p className='mt-1 text-sm font-black text-text-light dark:text-text-dark'>
                      {plan.name}
                    </p>
                  </div>

                  {plan.intervalLabel ? (
                    <div>
                      <p className='text-[9px] font-bold text-subtext-light dark:text-subtext-dark'>
                        بازه اشتراک
                      </p>
                      <p className='mt-1 text-sm font-black text-text-light dark:text-text-dark'>
                        {plan.intervalLabel}
                      </p>
                    </div>
                  ) : null}

                  {typeof plan.durationInDays === 'number' &&
                  plan.durationInDays > 0 ? (
                    <div>
                      <p className='text-[9px] font-bold text-subtext-light dark:text-subtext-dark'>
                        مدت اشتراک
                      </p>
                      <p className='mt-1 font-faNa text-sm font-black text-text-light dark:text-text-dark'>
                        {plan.durationInDays.toLocaleString('fa-IR')} روز
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className='mt-4 flex items-start gap-3 rounded-2xl border border-black/5 bg-surface-light/55 p-3 dark:border-white/10 dark:bg-surface-dark/45'>
                  <HiOutlineClock
                    size={18}
                    className='mt-0.5 shrink-0 text-secondary'
                  />
                  <p className='text-[10px] leading-6 text-subtext-light sm:text-xs sm:leading-7 dark:text-subtext-dark'>
                    اگر در حال حاضر اشتراک فعالی دارید، این اشتراک جدید بلافاصله
                    بعد از پایان اشتراک فعلی به صورت خودکار فعال می‌شود و روزهای
                    آن به انتهای اشتراک قبلی اضافه خواهد شد.
                  </p>
                </div>
              </div>
            ) : null}

            <div className='mt-5 flex flex-col gap-2 sm:flex-row'>
              <SiteButton
                type='button'
                variant='primary'
                size='md'
                endIcon={HiOutlineArrowLeft}
                onClick={() => router.replace('/subscriptions')}
                className='w-full sm:w-auto'
              >
                مشاهده اشتراک‌ها
              </SiteButton>

              <SiteButton
                type='button'
                variant='outline'
                size='md'
                startIcon={HiOutlineHome}
                onClick={() => router.replace('/')}
                className='w-full sm:w-auto'
              >
                بازگشت به صفحه اصلی
              </SiteButton>
            </div>
          </div>
        </SiteCard>
      </div>
    );
  }

  return (
    <div className='mt-6 space-y-5'>
      {TransactionCard}

      {/* Course / subscription result */}
      {courses.length > 0 ? (
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='overflow-hidden p-5 sm:p-6'
        >
          <SectionHeader
            icon={HiOutlineAcademicCap}
            eyebrow='دسترسی آموزشی'
            title='دوره‌های خریداری‌شده'
            badge={
              <SiteBadge variant='secondary' size='sm'>
                {courses.length.toLocaleString('fa-IR')} دوره
              </SiteBadge>
            }
          />

          <div className='mt-4 overflow-hidden rounded-[22px] border border-black/5 dark:border-white/10'>
            {courses.map((course, index) => {
              const isLoadingThisCourse =
                isClickLoading && shortAddressClick === course.shortAddress;

              return (
                <div
                  key={course.id}
                  className={`flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                    index < courses.length - 1
                      ? 'border-b border-black/5 dark:border-white/10'
                      : ''
                  }`}
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <MediaThumb src={course.cover} alt={course.title} course />

                    <div className='min-w-0'>
                      <p className='text-[9px] font-bold text-secondary'>
                        دوره آموزشی
                      </p>
                      <h3 className='mt-1 line-clamp-2 text-xs font-black leading-6 text-text-light sm:text-sm dark:text-text-dark'>
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  <SiteButton
                    type='button'
                    variant='primary'
                    size='sm'
                    endIcon={HiOutlineArrowLeft}
                    disabled={isLoadingThisCourse}
                    onClick={() => handleCourseClick(course.shortAddress)}
                    className='w-full shrink-0 sm:w-auto'
                  >
                    {isLoadingThisCourse ? (
                      <span className='flex items-center gap-2'>
                        <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                        در حال ورود...
                      </span>
                    ) : (
                      'مشاهده دوره'
                    )}
                  </SiteButton>
                </div>
              );
            })}
          </div>
        </SiteCard>
      ) : subscriptionPlans.length > 0 ? (
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='p-5 sm:p-6'
        >
          <SectionHeader
            icon={HiOutlineSparkles}
            eyebrow='اشتراک'
            title='اشتراک شما فعال شد'
            badge={
              <SiteBadge variant='yellow' size='sm'>
                فعال
              </SiteBadge>
            }
          />

          <div className='mt-4 rounded-[20px] border border-secondary/15 bg-secondary/[0.05] p-4 text-xs leading-7 text-subtext-light dark:bg-secondary/[0.08] dark:text-subtext-dark'>
            <p className='font-black text-text-light dark:text-text-dark'>
              پلن‌ها:{' '}
              {subscriptionPlans
                .map((plan) => plan.name)
                .filter(Boolean)
                .join('، ')}
            </p>
          </div>
        </SiteCard>
      ) : (
        <SiteCard
          variant='glass'
          padding='none'
          radius='md'
          className='flex items-start gap-3 p-4 sm:p-5'
        >
          <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
            <HiOutlineCheckCircle size={20} />
          </span>

          <p className='text-xs leading-7 text-subtext-light sm:text-sm dark:text-subtext-dark'>
            پرداخت با موفقیت انجام شد و می‌توانید از بخش سفارشات پروفایل کاربری،
            وضعیت سفارش خود را پیگیری کنید.
          </p>
        </SiteCard>
      )}

      {/* Shop order */}
      {hasShopPurchase ? (
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='overflow-hidden p-5 sm:p-6'
        >
          <SectionHeader
            icon={HiOutlineShoppingBag}
            eyebrow='سفارش فروشگاه'
            title='جزئیات سفارش محصولات'
            badge={
              <div className='flex flex-wrap gap-2'>
                <StatusPill className={statusBadgeClass(shopOrder?.status)}>
                  {humanizeShopStatus(shopOrder?.status)}
                </StatusPill>

                <StatusPill
                  className={paymentBadgeClass(shopOrder?.paymentStatus)}
                >
                  پرداخت {humanizePaymentStatus(shopOrder?.paymentStatus)}
                </StatusPill>
              </div>
            }
          />

          <div className='mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]'>
            {/* Items */}
            <div className='overflow-hidden rounded-[22px] border border-black/5 dark:border-white/10'>
              {shopItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-3 p-3.5 sm:p-4 ${
                    index < shopItems.length - 1
                      ? 'border-b border-black/5 dark:border-white/10'
                      : ''
                  }`}
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <MediaThumb src={item.coverImage} alt={item.title} />

                    <div className='min-w-0'>
                      <h3 className='line-clamp-2 text-xs font-black leading-6 text-text-light sm:text-sm dark:text-text-dark'>
                        {item.title}
                      </h3>

                      <p className='mt-1 font-faNa text-[9px] text-subtext-light sm:text-[10px] dark:text-subtext-dark'>
                        تعداد: {Number(item.qty || 1).toLocaleString('fa-IR')}
                      </p>
                    </div>
                  </div>

                  <div className='shrink-0 text-left'>
                    <p className='font-faNa text-[10px] font-bold text-text-light sm:text-xs dark:text-text-dark'>
                      {formatToman(item.unitPrice)}
                    </p>

                    <p className='mt-1 font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                      جمع:{' '}
                      {formatToman(
                        Number(item.unitPrice || 0) * Number(item.qty || 1)
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            {shopTotals ? (
              <div className='rounded-[22px] border border-secondary/15 bg-secondary/[0.045] p-4 xl:sticky xl:top-24 dark:bg-secondary/[0.075]'>
                <div className='mb-4 flex items-center gap-2'>
                  <HiOutlineReceiptPercent
                    size={18}
                    className='text-secondary'
                  />
                  <h3 className='text-xs font-black text-text-light dark:text-text-dark'>
                    خلاصه سفارش
                  </h3>
                </div>

                <div className='space-y-3 text-[10px] sm:text-xs'>
                  <div className='flex items-center justify-between gap-3'>
                    <span className='text-subtext-light dark:text-subtext-dark'>
                      جمع سبد
                    </span>
                    <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                      {formatToman(shopTotals.subtotal)}
                    </span>
                  </div>

                  <div className='flex items-center justify-between gap-3'>
                    <span className='text-subtext-light dark:text-subtext-dark'>
                      تخفیف
                    </span>
                    <span
                      className={`font-faNa font-bold ${
                        shopTotals.discountAmount !== 0 ? 'text-red' : ''
                      }`}
                    >
                      {shopTotals.discountAmount === 0
                        ? '-'
                        : formatToman(shopTotals.discountAmount)}
                    </span>
                  </div>

                  <div className='flex items-start justify-between gap-3'>
                    <span className='text-subtext-light dark:text-subtext-dark'>
                      هزینه ارسال
                    </span>

                    {shopOrder?.shippingMethod === 'POST' ? (
                      <span className='max-w-[180px] text-left font-faNa font-bold text-text-light dark:text-text-dark'>
                        {shopOrder?.postOptionKey === 'FALLBACK_POST_FAST' &&
                        shopTotals?.shippingCost === 0 ? (
                          <span className='text-[9px] leading-5 text-red'>
                            هزینه ارسال بعداً محاسبه می‌شود.
                          </span>
                        ) : shopTotals?.shippingCost === 0 ? (
                          'رایگان'
                        ) : (
                          formatToman(shopTotals.shippingCost)
                        )}
                      </span>
                    ) : (
                      <span className='font-bold text-text-light dark:text-text-dark'>
                        در محل
                      </span>
                    )}
                  </div>

                  <div className='h-px bg-secondary/15' />

                  <div className='flex items-end justify-between gap-3'>
                    <span className='font-black text-text-light dark:text-text-dark'>
                      مبلغ پرداختی
                    </span>
                    <strong className='font-faNa text-sm font-black text-secondary'>
                      {formatToman(shopTotals.payableOnline)}
                    </strong>
                  </div>
                </div>

                {shopOrder?.shippingTitle || shopOrder?.trackingCode ? (
                  <div className='mt-4 space-y-2 border-t border-black/5 pt-4 text-[9px] leading-5 text-subtext-light dark:border-white/10 dark:text-subtext-dark'>
                    {shopOrder?.shippingTitle ? (
                      <p className='flex items-start gap-2'>
                        <HiOutlineTruck
                          size={14}
                          className='mt-0.5 shrink-0 text-secondary'
                        />
                        <span>روش ارسال: {shopOrder.shippingTitle}</span>
                      </p>
                    ) : null}

                    {shopOrder?.trackingCode ? (
                      <p className='font-faNa'>
                        کد رهگیری مرسوله: {shopOrder.trackingCode}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className='mt-5 flex flex-col gap-2 border-t border-black/5 pt-5 sm:flex-row dark:border-white/10'>
            <SiteButton
              type='button'
              variant='primary'
              size='md'
              endIcon={HiOutlineArrowLeft}
              onClick={() => router.push('/profile?active=1')}
              className='w-full sm:w-auto'
            >
              پیگیری سفارش
            </SiteButton>

            <SiteButton
              type='button'
              variant='outline'
              size='md'
              onClick={() => router.replace('/shop/products')}
              className='w-full sm:w-auto'
            >
              سایر محصولات
            </SiteButton>
          </div>
        </SiteCard>
      ) : null}

      {/* Footer actions */}
      <SiteCard
        variant='glass'
        padding='none'
        radius='md'
        className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5'
      >
        <div>
          <p className='text-xs font-black text-text-light dark:text-text-dark'>
            خرید شما آماده استفاده است
          </p>
          <p className='mt-1 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
            می‌توانید از همین حالا به محتوای خریداری‌شده یا بخش‌های دیگر سایت
            دسترسی داشته باشید.
          </p>
        </div>

        <div className='flex flex-col gap-2 sm:flex-row'>
          {subscriptionPlans.length > 0 ? (
            <SiteButton
              type='button'
              variant='primary'
              size='sm'
              onClick={() => router.replace('/subscriptions')}
              className='w-full sm:w-auto'
            >
              مشاهده اشتراک‌ها
            </SiteButton>
          ) : null}

          <SiteButton
            type='button'
            variant='outline'
            size='sm'
            startIcon={HiOutlineHome}
            onClick={() => router.replace('/')}
            className='w-full sm:w-auto'
          >
            صفحه اصلی
          </SiteButton>
        </div>
      </SiteCard>
    </div>
  );
};

PaymentSuccessfully.propTypes = {
  paymentDetails: PropTypes.shape({
    transactionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cart: PropTypes.shape({
      cartCourses: PropTypes.array,
      cartSubscriptions: PropTypes.array,
    }),
    shopOrder: PropTypes.shape({
      id: PropTypes.number,
      status: PropTypes.string,
      paymentStatus: PropTypes.string,
      trackingCode: PropTypes.string,
      shippingTitle: PropTypes.string,
      shippingMethod: PropTypes.string,
      postOptionKey: PropTypes.string,
      shippingCost: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      subtotal: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      discountAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      payableOnline: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      payableCOD: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      createdAt: PropTypes.any,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number,
          productId: PropTypes.number,
          qty: PropTypes.number,
          title: PropTypes.string,
          unitPrice: PropTypes.number,
          coverImage: PropTypes.string,
          slug: PropTypes.string,
        })
      ),
    }),
  }).isRequired,
  transactionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default PaymentSuccessfully;
