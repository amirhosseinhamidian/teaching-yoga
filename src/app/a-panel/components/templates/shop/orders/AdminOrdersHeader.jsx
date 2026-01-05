/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ImSpinner2 } from 'react-icons/im';
import { FiRefreshCw } from 'react-icons/fi';
import {
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowUturnLeft,
} from 'react-icons/hi2';
import SearchBox from '../../../modules/SearchBox/SearchBox';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Button from '@/components/Ui/Button/Button';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

const CARD_CONFIG = {
  total: {
    icon: HiOutlineShoppingBag,
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10',
  },
  pendingPayment: {
    icon: HiOutlineClock,
    color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10',
  },
  preparing: {
    icon: HiOutlineCube,
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10',
  },
  shipped: {
    icon: HiOutlineTruck,
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10',
  },
  delivered: {
    icon: HiOutlineCheckCircle,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  },
  cancelled: {
    icon: HiOutlineXCircle,
    color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10',
  },
  returned: {
    icon: HiOutlineArrowUturnLeft,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
  },
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'همه وضعیت‌ها' },
  { value: 'PENDING_PAYMENT', label: 'در انتظار پرداخت' },
  { value: 'PROCESSING', label: 'در حال پردازش' },
  { value: 'PACKED', label: 'بسته‌بندی شده' },
  { value: 'SHIPPED', label: 'ارسال شده' },
  { value: 'DELIVERED', label: 'تحویل شده' },
  { value: 'CANCELLED', label: 'لغو شده' },
  { value: 'RETURNED', label: 'مرجوعی' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'همه پرداخت‌ها' },
  { value: 'PENDING', label: 'در انتظار' },
  { value: 'SUCCESSFUL', label: 'موفق' },
  { value: 'FAILED', label: 'ناموفق' },
];

const SHIPPING_METHOD_OPTIONS = [
  { value: 'ALL', label: 'همه روش‌های ارسال' },
  { value: 'POST', label: 'پست' },
  { value: 'COURIER_COD', label: 'پیک (پرداخت در محل)' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'amount_desc', label: 'بیشترین مبلغ' },
  { value: 'amount_asc', label: 'کمترین مبلغ' },
];

function toFaNumber(n) {
  return Number(n || 0).toLocaleString('fa-IR');
}

function buildQS(current, patch) {
  const sp = new URLSearchParams(current.toString());
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === 'ALL') sp.delete(k);
    else sp.set(k, String(v));
  });
  // ریست صفحه وقتی فیلتر عوض شد
  if (
    patch.status ||
    patch.paymentStatus ||
    patch.shippingMethod ||
    patch.q ||
    patch.sort
  ) {
    sp.set('page', '1');
  }
  return sp.toString();
}

export default function AdminOrdersHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // read from url
  const status = (searchParams.get('status') || 'ALL').toUpperCase();
  const paymentStatus = (
    searchParams.get('paymentStatus') || 'ALL'
  ).toUpperCase();
  const shippingMethod = (
    searchParams.get('shippingMethod') || 'ALL'
  ).toUpperCase();
  const sort = (searchParams.get('sort') || 'newest').toLowerCase();
  const q = searchParams.get('q') || '';

  // local input (برای جلوگیری از replace روی هر تایپ)
  const [qInput, setQInput] = useState(q);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  // counts
  const [countsLoading, setCountsLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    counts: {
      pendingPayment: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    },
  });

  const fetchCounts = async () => {
    setCountsLoading(true);
    try {
      const res = await fetch('/api/admin/shop/orders/counts', {
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'counts error');
      console.log(json);
      setCounts({
        total: Number(json?.total || 0),
        counts: {
          pendingPayment: Number(json?.counts?.pendingPayment || 0),
          preparing: Number(json?.counts?.preparing || 0),
          shipped: Number(json?.counts?.shipped || 0),
          delivered: Number(json?.counts?.delivered || 0),
          cancelled: Number(json?.counts?.cancelled || 0),
          returned: Number(json?.counts?.returned || 0),
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCountsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const cards = useMemo(() => {
    return [
      { key: 'total', title: 'کل سفارش‌ها', value: counts.total },
      {
        key: 'pendingPayment',
        title: 'در انتظار پرداخت',
        value: counts.counts.pendingPayment,
      },
      { key: 'preparing', title: 'آماده‌سازی', value: counts.counts.preparing },
      { key: 'shipped', title: 'ارسال‌شده', value: counts.counts.shipped },
      { key: 'delivered', title: 'تحویل‌شده', value: counts.counts.delivered },
      { key: 'cancelled', title: 'لغو شده', value: counts.counts.cancelled },
      { key: 'returned', title: 'مرجوعی', value: counts.counts.returned },
    ];
  }, [counts]);

  const apply = (patch) => {
    const qs = buildQS(searchParams, patch);
    router.replace(`${pathname}?${qs}`);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    apply({ q: qInput?.trim() ? qInput.trim() : '' });
  };

  const clearFilters = () => {
    router.replace(
      `${pathname}?page=1&pageSize=${searchParams.get('pageSize') || 10}`
    );
  };

  return (
    <div className='mb-5 rounded-2xl bg-surface-light p-4 dark:bg-surface-dark'>
      {/* Counts cards */}
      <div className='mb-4'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='text-sm font-semibold'>وضعیت کلی سفارش‌ها</div>
          {countsLoading ? (
            <div className='flex items-center gap-1 rounded-xl bg-subtext-light/5 px-2 py-1 text-xs text-subtext-light md:text-sm dark:bg-subtext-dark/5 dark:text-subtext-dark'>
              <ImSpinner2 className='animate-spin' />
              در حال دریافت...
            </div>
          ) : (
            <button
              type='button'
              onClick={fetchCounts}
              className='flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-secondary transition-all duration-200 hover:bg-secondary/10 md:text-sm'
            >
              <FiRefreshCw /> بروزرسانی
            </button>
          )}
        </div>

        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7'>
          {cards.map((c) => {
            const cfg = CARD_CONFIG[c.key];
            const Icon = cfg?.icon;

            return (
              <div
                key={c.key}
                className='flex items-center justify-between rounded-xl border border-gray-200 bg-white/30 p-4 dark:border-gray-700 dark:bg-foreground-dark/30'
              >
                {/* Left content */}
                <div>
                  <div className='text-[11px] text-slate-500 dark:text-slate-300'>
                    {c.title}
                  </div>
                  <div className='mt-1 font-faNa text-lg font-semibold'>
                    {toFaNumber(c.value)}
                  </div>
                </div>

                {/* Icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${cfg?.color}`}
                >
                  {Icon && <Icon size={20} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className='border-t border-gray-200 pt-4 dark:border-gray-700'>
        <div className='mb-3 text-sm font-semibold'>فیلترها</div>

        <form
          onSubmit={submitSearch}
          className='grid grid-cols-1 gap-3 lg:grid-cols-12'
        >
          {/* search */}
          <div className='lg:col-span-4'>
            <label className='mb-1 mr-2 block text-xs text-slate-500 dark:text-slate-300'>
              جستجو (شماره سفارش / نام / موبایل / کد رهگیری)
            </label>
            <SearchBox
              placeholder='مثلاً ۱۲۳ یا ۰۹۱۲...'
              value={qInput}
              onChange={setQInput}
              className='w-full'
              inputClassName='text-xs md:text-sm'
              onSearch={() => onSearch?.(searchText)}
            />
          </div>

          {/* status */}
          <div className='lg:col-span-2'>
            <label className='mb-1 block text-xs text-slate-500 dark:text-slate-300'>
              وضعیت سفارش
            </label>
            <DropDown
              value={status}
              onChange={(value) => apply({ status: value })}
              options={STATUS_OPTIONS}
              fullWidth
              optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
              className='bg-surface-light px-4 text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
            />
          </div>

          {/* paymentStatus */}
          <div className='lg:col-span-2'>
            <label className='mb-1 mr-2 block text-xs text-slate-500 dark:text-slate-300'>
              وضعیت پرداخت
            </label>
            <DropDown
              value={paymentStatus}
              onChange={(value) => apply({ paymentStatus: value })}
              options={PAYMENT_STATUS_OPTIONS}
              fullWidth
              optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
              className='bg-surface-light px-4 text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
            />
          </div>

          {/* shippingMethod */}
          <div className='lg:col-span-2'>
            <label className='mb-1 mr-2 block text-xs text-slate-500 dark:text-slate-300'>
              روش ارسال
            </label>
            <DropDown
              value={shippingMethod}
              onChange={(value) => apply({ shippingMethod: value })}
              options={SHIPPING_METHOD_OPTIONS}
              fullWidth
              optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
              className='bg-surface-light px-4 text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
            />
          </div>

          {/* sort */}
          <div className='lg:col-span-2'>
            <label className='mb-1 mr-2 block text-xs text-slate-500 dark:text-slate-300'>
              مرتب‌سازی
            </label>
            <DropDown
              value={sort}
              onChange={(value) => apply({ sort: value })}
              options={SORT_OPTIONS}
              fullWidth
              optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
              className='bg-surface-light px-4 text-text-light placeholder:text-xs dark:bg-surface-dark dark:text-text-dark'
            />
          </div>

          {/* actions */}
          <div className='flex items-end gap-2 lg:col-span-12'>
            <Button type='submit' className='text-sm md:text-sm' shadow>
              اعمال جستجو
            </Button>
            <OutlineButton
              type='button'
              onClick={clearFilters}
              className='text-sm md:text-sm'
            >
              پاک کردن فیلترها
            </OutlineButton>
          </div>
        </form>
      </div>
    </div>
  );
}
