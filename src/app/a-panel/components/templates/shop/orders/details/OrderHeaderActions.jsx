/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineArrowPath, HiOutlineCheck } from 'react-icons/hi2';
import Button from '@/components/Ui/Button/Button';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';

const toFaNumber = (n) => Number(n || 0).toLocaleString('fa-IR');
const formatToman = (n) => `${toFaNumber(n)} تومان`;

const formatDateFa = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const humanizeStatus = (s) => {
  const v = String(s || '').toUpperCase();
  switch (v) {
    case 'PENDING_PAYMENT':
      return 'در انتظار پرداخت';
    case 'PROCESSING':
      return 'در حال پردازش';
    case 'PACKED':
      return 'بسته‌بندی';
    case 'SHIPPED':
      return 'ارسال‌شده';
    case 'DELIVERED':
      return 'تحویل‌شده';
    case 'CANCELLED':
      return 'لغو شده';
    case 'RETURNED':
      return 'مرجوعی';
    default:
      return s || '—';
  }
};

const humanizePayment = (s) => {
  const v = String(s || '').toUpperCase();
  switch (v) {
    case 'SUCCESSFUL':
      return 'موفق';
    case 'FAILED':
      return 'ناموفق';
    case 'PENDING':
      return 'در انتظار';
    default:
      return s || '—';
  }
};

const statusBadgeClass = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PENDING_PAYMENT')
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
  if (s === 'PROCESSING')
    return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30';
  if (s === 'PACKED')
    return 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30';
  if (s === 'SHIPPED')
    return 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-500/30';
  if (s === 'DELIVERED')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (s === 'CANCELLED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';
  if (s === 'RETURNED')
    return 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-500/30';
  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30';
};

const paymentBadgeClass = (paymentStatus) => {
  const s = String(paymentStatus || '').toUpperCase();
  if (s === 'SUCCESSFUL')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (s === 'FAILED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';
  if (s === 'PENDING')
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
  return 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:ring-gray-500/30';
};

const Badge = ({ className = '', children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${className}`}
  >
    {children}
  </span>
);

Badge.propTypes = { className: PropTypes.string, children: PropTypes.node };

const STATUS_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
  { value: 'PROCESSING', label: 'در حال پردازش' },
  { value: 'PACKED', label: 'بسته‌بندی' },
  { value: 'SHIPPED', label: 'ارسال‌شده' },
  { value: 'DELIVERED', label: 'تحویل‌شده' },
  { value: 'CANCELLED', label: 'لغو شده' },
  { value: 'RETURNED', label: 'مرجوعی' },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: 'POST', label: 'پست' },
  { value: 'COURIER_COD', label: 'پیک (پرداخت در محل)' },
];

const DEFAULT_SHIPPING_TITLES = {
  POST: 'پست',
  COURIER_COD: 'ارسال با پیک',
};

// برای تشخیص اینکه عنوان فعلی "اتومات" بوده یا نه
const AUTO_TITLES_BY_METHOD = {
  POST: new Set(['پست', 'پست پیشتاز', 'پست سفارشی', 'پستکس']),
  COURIER_COD: new Set(['ارسال با پیک', 'پیک', 'پیک (پرداخت در محل)']),
};

const toIntSafe = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export default function OrderHeaderActions({
  order,
  saving,
  onSave,
  onRefresh,
}) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // local editable fields
  const [status, setStatus] = useState(
    String(order?.status || '').toUpperCase()
  );
  const [trackingCode, setTrackingCode] = useState(order?.trackingCode || '');

  const [shippingMethod, setShippingMethod] = useState(
    String(order?.shippingMethod || 'POST').toUpperCase()
  );
  const [shippingCost, setShippingCost] = useState(
    String(order?.shippingCost ?? 0)
  );

  const [shippingTitle, setShippingTitle] = useState(
    order?.shippingTitle || ''
  );
  const [shippingTitleTouched, setShippingTitleTouched] = useState(false);

  const prevShippingMethodRef = useRef(
    String(order?.shippingMethod || 'POST').toUpperCase()
  );

  const isPaid = useMemo(() => {
    return String(order?.paymentStatus || '').toUpperCase() === 'SUCCESSFUL';
  }, [order?.paymentStatus]);

  // ✅ sync state with order updates
  useEffect(() => {
    setStatus(String(order?.status || '').toUpperCase());
    setTrackingCode(order?.trackingCode || '');

    const nextMethod = String(order?.shippingMethod || 'POST').toUpperCase();
    setShippingMethod(nextMethod);
    setShippingCost(String(order?.shippingCost ?? 0));

    setShippingTitle(order?.shippingTitle || '');
    setShippingTitleTouched(false);

    prevShippingMethodRef.current = nextMethod;
  }, [
    order?.id,
    order?.status,
    order?.trackingCode,
    order?.shippingMethod,
    order?.shippingCost,
    order?.shippingTitle,
  ]);

  // ✅ auto update shippingTitle based on shippingMethod (only if not touched)
  useEffect(() => {
    const method = String(shippingMethod || 'POST').toUpperCase();

    if (shippingTitleTouched) {
      prevShippingMethodRef.current = method;
      return;
    }

    const prevMethod = String(
      prevShippingMethodRef.current || 'POST'
    ).toUpperCase();
    const current = String(shippingTitle || '').trim();

    const suggestedTitle = String(DEFAULT_SHIPPING_TITLES[method] || '');
    const prevAutoSet = AUTO_TITLES_BY_METHOD[prevMethod] || new Set();

    // اگر عنوان خالیه یا قبلاً عنوان اتوماتِ روش قبلی بوده
    if ((!current || prevAutoSet.has(current)) && current !== suggestedTitle) {
      setShippingTitle(suggestedTitle); // ✅ فقط string
    }

    prevShippingMethodRef.current = method;
  }, [shippingMethod, shippingTitleTouched, shippingTitle]);

  const dirty = useMemo(() => {
    const currentStatus = String(order?.status || '').toUpperCase();
    const currentTracking = order?.trackingCode || '';
    const currentShippingTitle = order?.shippingTitle || '';
    const currentShippingMethod = String(
      order?.shippingMethod || 'POST'
    ).toUpperCase();
    const currentShippingCost = String(order?.shippingCost ?? 0);

    return (
      status !== currentStatus ||
      String(trackingCode || '') !== String(currentTracking || '') ||
      String(shippingTitle || '') !== String(currentShippingTitle || '') ||
      String(shippingMethod || '') !== String(currentShippingMethod || '') ||
      String(shippingCost || '') !== String(currentShippingCost || '')
    );
  }, [
    order,
    status,
    trackingCode,
    shippingTitle,
    shippingMethod,
    shippingCost,
  ]);

  const handleSave = async () => {
    const shippingCostNum = Math.max(0, toIntSafe(shippingCost, 0));

    const patch = {
      status,
      trackingCode: trackingCode?.trim() ? trackingCode.trim() : null,
      shippingTitle: shippingTitle?.trim() ? shippingTitle.trim() : null,
      shippingMethod: String(shippingMethod || 'POST').toUpperCase(),
      shippingCost: shippingCostNum,
    };

    const ok = await onSave?.(patch);
    if (ok) {
      await onRefresh?.();
      toast.showSuccessToast('تغییرات با موفقیت اعمال شد.');
    }
  };

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
      {/* top */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <h2 className='text-sm font-semibold md:text-base'>
              سفارش #{toFaNumber(order?.id)}
            </h2>
          </div>

          <div className='text-xs text-subtext-light dark:text-subtext-dark'>
            ثبت شده در:{' '}
            <span className='font-faNa'>{formatDateFa(order?.createdAt)}</span>
            {' · '}
            آخرین بروزرسانی:{' '}
            <span className='font-faNa'>{formatDateFa(order?.updatedAt)}</span>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Badge className={statusBadgeClass(order?.status)}>
            {humanizeStatus(order?.status)}
          </Badge>
          <Badge className={paymentBadgeClass(order?.paymentStatus)}>
            پرداخت:‌ {humanizePayment(order?.paymentStatus)}
          </Badge>
        </div>
      </div>

      {/* summary */}
      <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-xl bg-background-light p-3 text-xs dark:bg-foreground-dark/30'>
          <div className='text-subtext-light dark:text-subtext-dark'>
            مبلغ نهایی
          </div>
          <div className='mt-1 font-faNa text-sm font-semibold'>
            {formatToman(order?.payableOnline)}
          </div>
        </div>

        <div className='rounded-xl bg-background-light p-3 text-xs dark:bg-foreground-dark/30'>
          <div className='text-subtext-light dark:text-subtext-dark'>
            جمع کالاها
          </div>
          <div className='mt-1 font-faNa text-sm font-semibold'>
            {formatToman(order?.subtotal)}
          </div>
        </div>

        <div className='rounded-xl bg-background-light p-3 text-xs dark:bg-foreground-dark/30'>
          <div className='text-subtext-light dark:text-subtext-dark'>
            هزینه ارسال
          </div>
          <div className='mt-1 font-faNa text-sm font-semibold'>
            {formatToman(order?.shippingCost)}
          </div>
        </div>

        <div className='rounded-xl bg-background-light p-3 text-xs dark:bg-foreground-dark/30'>
          <div className='text-subtext-light dark:text-subtext-dark'>تخفیف</div>
          <div className='mt-1 font-faNa text-sm font-semibold'>
            {formatToman(order?.discountAmount)}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className='mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4'>
        {/* status */}
        <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='mb-1 mr-2 text-xs text-subtext-light dark:text-subtext-dark'>
            تغییر وضعیت سفارش
          </div>
          <DropDown
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            fullWidth
            optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
          />

          <p className='mr-2 mt-2 text-[11px] text-subtext-light dark:text-subtext-dark'>
            پیشنهاد: وقتی «ارسال‌شده» می‌شود، کد رهگیری هم ثبت شود.
          </p>
        </div>

        {/* tracking */}
        <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='mb-1 mr-2 text-xs text-subtext-light dark:text-subtext-dark'>
            کد رهگیری
          </div>
          <Input
            value={trackingCode}
            onChange={setTrackingCode}
            placeholder='مثلاً: 1234567890'
            className='text-sm'
          />

          <p className='mr-2 mt-2 text-[11px] text-subtext-light dark:text-subtext-dark'>
            اگر سفارش با پیک تحویل شده، می‌تونی اینجا رو خالی بذاری.
          </p>
        </div>

        {/* shipping title */}
        <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='mb-1 mr-2 text-xs text-subtext-light dark:text-subtext-dark'>
            عنوان ارسال
          </div>

          <Input
            value={shippingTitle}
            onChange={(v) => {
              setShippingTitleTouched(true);
              setShippingTitle(v);
            }}
            className='text-sm'
            placeholder='مثلاً: پست پیشتاز / پیک تهران'
          />
          <p className='mr-2 mt-2 text-[11px] text-subtext-light dark:text-subtext-dark'>
            اگر سرویس ارسال تغییر کرد یا دستی می‌خوای نمایش بدی، این فیلد به درد
            می‌خوره.
          </p>
        </div>

        {/* shipping method/cost */}
        <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='mb-1 mr-2 text-xs text-subtext-light dark:text-subtext-dark'>
            تنظیمات هزینه ارسال
          </div>

          <div className='grid grid-cols-1 gap-2'>
            <DropDown
              options={SHIPPING_METHOD_OPTIONS}
              value={shippingMethod}
              onChange={setShippingMethod}
              fullWidth
              optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
              valueClassName='text-sm'
            />

            <Input
              thousandSeparator
              min={0}
              value={shippingCost}
              onChange={setShippingCost}
              className='text-sm'
              placeholder='مثلاً: 75,000'
            />
          </div>

          <p className='mr-2 mt-2 text-[11px] text-subtext-light dark:text-subtext-dark'>
            {isPaid
              ? 'این سفارش پرداخت موفق دارد. تغییر هزینه ارسال فقط برای ثبت داخلی است و مبلغ پرداختی کاربر تغییر نمی‌کند.'
              : 'در سفارش‌های پرداخت‌نشده، با تغییر روش/هزینه ارسال مبلغ نهایی هم توسط سرور بازمحاسبه می‌شود.'}
          </p>
        </div>
      </div>

      {/* footer */}
      <div className='mt-4 flex flex-wrap items-center justify-end gap-2'>
        <Button
          type='button'
          onClick={onRefresh}
          isLoading={saving}
          className='inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs transition-all duration-200 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-transparent dark:text-subtext-dark dark:hover:bg-subtext-dark/5'
        >
          <HiOutlineArrowPath size={18} />
          رفرش
        </Button>

        <Button
          type='button'
          onClick={handleSave}
          disabled={saving || !dirty}
          className='inline-flex items-center gap-2 px-2 text-xs transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
        >
          <HiOutlineCheck size={18} />
          ذخیره تغییرات
        </Button>
      </div>
    </div>
  );
}

OrderHeaderActions.propTypes = {
  order: PropTypes.object.isRequired,
  saving: PropTypes.bool,
  onSave: PropTypes.func,
  onRefresh: PropTypes.func,
};
