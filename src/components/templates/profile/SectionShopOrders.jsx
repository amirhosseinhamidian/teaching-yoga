/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';

import Pagination from '@/components/Ui/Pagination/Pagination';
import Modal from '@/components/modules/Modal/Modal';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

import ReturnRequestModal from './ReturnRequestModal';

import {
  HiOutlineArrowUturnLeft,
  HiOutlineCheckCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineClock,
  HiOutlineClipboardDocumentCheck,
  HiOutlineInformationCircle,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { ImSpinner2 } from 'react-icons/im';
import { MdContentCopy, MdOutlineCancel } from 'react-icons/md';
import { TbTruckReturn } from 'react-icons/tb';

const PER_PAGE = 5;

const TABS = [
  { key: 'preparing', title: 'در حال آماده‌سازی', icon: HiOutlineClock },
  { key: 'shipped', title: 'ارسال شده', icon: HiOutlineTruck },
  { key: 'delivered', title: 'تکمیل شده', icon: HiOutlineCheckCircle },
  { key: 'cancelled', title: 'لغو شده', icon: HiOutlineXCircle },
  { key: 'returned', title: 'مرجوعی', icon: HiOutlineArrowUturnLeft },
];

const RETURN_STATUS_META = {
  PENDING: {
    label: 'در انتظار بررسی',
    tone: 'border-yellow/20 bg-yellow/10 text-yellow',
  },
  APPROVED: {
    label: 'تایید شده',
    tone: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  },
  REJECTED: {
    label: 'رد شده',
    tone: 'border-red/20 bg-red/10 text-red',
  },
  COMPLETED: {
    label: 'مرجوعی انجام شد',
    tone: 'border-secondary/20 bg-secondary/10 text-secondary',
  },
};

const RETURN_REASON_LABEL = {
  DAMAGED: 'خراب/آسیب‌دیده',
  WRONG_ITEM: 'ارسال اشتباه',
  SIZE_ISSUE: 'مشکل سایز',
  COLOR_ISSUE: 'مشکل رنگ',
  NOT_AS_DESCRIBED: 'مطابق توضیحات نبود',
  OTHER: 'سایر',
};

const formatToman = (n) => `${Number(n || 0).toLocaleString('fa-IR')} تومان`;

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

const humanizeShopStatus = (s) => {
  const v = String(s || '').toUpperCase();
  switch (v) {
    case 'PROCESSING':
      return 'در حال پردازش';
    case 'PACKED':
      return 'آماده ارسال';
    case 'SHIPPED':
      return 'ارسال شده';
    case 'DELIVERED':
      return 'تحویل شده';
    case 'CANCELLED':
      return 'لغو شده';
    case 'RETURNED':
      return 'مرجوعی';
    case 'PENDING_PAYMENT':
      return 'در انتظار پرداخت';
    default:
      return s || '—';
  }
};

const canCancelOrder = (order) => {
  const st = String(order?.status || '').toUpperCase();
  const paid =
    String(order?.paymentStatus || '').toUpperCase() === 'SUCCESSFUL';
  return paid && st === 'PROCESSING' && !order?.trackingCode;
};

const canConfirmDelivery = (order) => {
  const st = String(order?.status || '').toUpperCase();
  const paid =
    String(order?.paymentStatus || '').toUpperCase() === 'SUCCESSFUL';
  return paid && st === 'SHIPPED';
};

const shouldShowTracking = (status) => {
  const hiddenStatuses = ['DELIVERED', 'CANCELLED', 'RETURNED'];
  return !hiddenStatuses.includes(String(status || '').toUpperCase());
};

const canRequestReturn = (order) => {
  const st = String(order?.status || '').toUpperCase();
  if (st !== 'DELIVERED') return false;

  const updatedAt = order?.updatedAt || order?.deliveryDate || order?.createdAt;
  if (!updatedAt) return false;

  const diff = Date.now() - new Date(updatedAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return diff <= sevenDays;
};

const getStatusTone = (status) => {
  const value = String(status || '').toUpperCase();

  if (value === 'DELIVERED') {
    return 'border-secondary/20 bg-secondary/10 text-secondary';
  }

  if (value === 'SHIPPED') {
    return 'border-blue/20 bg-blue/10 text-blue';
  }

  if (value === 'CANCELLED') {
    return 'border-red/20 bg-red/10 text-red';
  }

  if (value === 'RETURNED') {
    return 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-300';
  }

  return 'border-yellow/20 bg-yellow/10 text-yellow';
};

export default function SectionShopOrders({ onCounts }) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const [activeTab, setActiveTab] = useState('preparing');

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [orders, setOrders] = useState([]);
  const [openId, setOpenId] = useState(null);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tempId, setTempId] = useState(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);

  const [countsLoading, setCountsLoading] = useState(true);
  const [tabCounts, setTabCounts] = useState({
    preparing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  });

  const router = useRouter();

  const totalPages = useMemo(() => {
    const t = Number(total || 0);
    return Math.max(1, Math.ceil(t / PER_PAGE));
  }, [total]);

  const selectedTab = useMemo(
    () => TABS.find((t) => t.key === activeTab),
    [activeTab]
  );

  const fetchOrders = async ({ tabKey, pageNum }) => {
    const res = await fetch(
      `/api/profile/shop-orders?status=${tabKey}&page=${pageNum}&pageSize=${PER_PAGE}`,
      { cache: 'no-store', credentials: 'include' }
    );

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || json?.message || 'خطا در دریافت سفارش‌ها');
    }
    return json;
  };

  const load = async (tab = activeTab, pageNum = 1) => {
    setLoading(true);
    try {
      const data = await fetchOrders({ tabKey: tab, pageNum });
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setTotal(Number(data?.total || 0));
      setPage(Number(data?.page || pageNum));
    } catch (e) {
      console.error(e);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    setCountsLoading(true);
    try {
      const res = await fetch('/api/profile/shop-orders/counts', {
        cache: 'no-store',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json?.error || 'خطا در دریافت تعداد سفارش‌ها');

      setTabCounts(json?.counts || {});
      onCounts?.({
        total: Number(json?.total || 0),
        counts: json?.counts || {},
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCountsLoading(false);
    }
  };

  useEffect(() => {
    setOpenId(null);
    setPage(1);
    load(activeTab, 1);
  }, [activeTab]);

  useEffect(() => {
    load(activeTab, page);
  }, [page]);

  useEffect(() => {
    fetchCounts();
  }, []);

  const onPageChange = (newPage) => {
    const p = Math.max(1, Math.min(Number(newPage || 1), totalPages));
    setOpenId(null);
    setPage(p);
  };

  const handleCancel = async () => {
    try {
      const res = await fetch(`/api/profile/shop-orders/${tempId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showErrorToast(
          json?.error || json?.message || 'خطا در لغو سفارش'
        );
        return;
      }
      setActiveTab('cancelled');
      toast.showSuccessToast('سفارش شما لغو شد.');

      await load(activeTab, page);
      await fetchCounts();
    } catch (e) {
      console.error(e);
      toast.showErrorToast('خطای ناشناخته در لغو سفارش');
    } finally {
      setShowCancelModal(false);
      setTempId(null);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch(
        `/api/profile/shop-orders/${orderId}/confirm-delivery`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showErrorToast(
          json?.error || json?.message || 'خطا در تایید تحویل'
        );
        return;
      }

      setActiveTab('delivered');
      setPage(1);
      toast.showSuccessToast('دریافت محصول توسط شما تایید شد.');
      await fetchCounts();
    } catch (e) {
      console.error(e);
      toast.showErrorToast('خطای ناشناخته در تایید تحویل');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className='w-full'>
      <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-[10px] font-bold text-secondary'>فروشگاه</p>
          <h3 className='mt-1 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
            سفارشات فروشگاه
          </h3>
          <p className='mt-1 text-[10px] text-subtext-light dark:text-subtext-dark'>
            وضعیت آماده‌سازی، ارسال، تحویل و مرجوعی سفارش‌های خود را پیگیری کنید.
          </p>
        </div>

        <span className='inline-flex w-fit items-center gap-1.5 rounded-xl border border-secondary/15 bg-secondary/5 px-3 py-1.5 text-[9px] font-bold text-secondary'>
          <HiOutlineShoppingBag size={14} />
          {selectedTab?.title}
        </span>
      </div>

      <div className='hide-scrollbar mb-4 flex w-full gap-2 overflow-x-auto pb-1'>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const count = Number(tabCounts?.[t.key] || 0);

          return (
            <button
              key={t.key}
              type='button'
              onClick={() => setActiveTab(t.key)}
              className={`flex min-h-11 min-w-fit items-center gap-2 whitespace-nowrap rounded-2xl border px-3 text-[10px] font-black transition-all sm:text-xs ${
                isActive
                  ? 'border-secondary/20 bg-secondary text-white shadow-[0_10px_26px_rgba(38,145,125,0.18)]'
                  : 'border-black/5 bg-background-light/45 text-subtext-light hover:border-secondary/20 hover:bg-secondary/5 hover:text-secondary dark:border-white/10 dark:bg-background-dark/30 dark:text-subtext-dark'
              }`}
            >
              <Icon size={17} />
              <span>{t.title}</span>

              {!countsLoading && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-lg px-1 font-faNa text-[9px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-black/[0.04] text-text-light dark:bg-white/[0.06] dark:text-text-dark'
                  }`}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className='flex min-h-[340px] w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-black/5 dark:border-white/10'>
          <ImSpinner2 size={34} className='animate-spin text-secondary' />
          <p className='text-xs text-subtext-light dark:text-subtext-dark'>
            در حال دریافت سفارش‌ها...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          className='px-5 py-14 text-center'
        >
          <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary/10 text-secondary'>
            <HiOutlineShoppingBag size={30} />
          </span>
          <h3 className='mt-4 text-sm font-black text-text-light dark:text-text-dark'>
            سفارشی در این وضعیت وجود ندارد
          </h3>
          <p className='mx-auto mt-2 max-w-sm text-[10px] leading-6 text-subtext-light sm:text-xs dark:text-subtext-dark'>
            سفارش‌های مرتبط با وضعیت «{selectedTab?.title}» در این بخش نمایش داده
            می‌شوند.
          </p>
        </SiteCard>
      ) : (
        <div className='space-y-3'>
          {orders.map((o) => {
            const isOpen = openId === o.id;

            return (
              <SiteCard
                key={o.id}
                variant='glass'
                padding='none'
                radius='lg'
                className='relative overflow-hidden p-4 sm:p-5'
              >
                <div
                  aria-hidden='true'
                  className='pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-secondary/[0.055] blur-[70px]'
                />

                <div className='relative z-10'>
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span
                          className={`rounded-xl border px-2.5 py-1.5 text-[9px] font-black ${getStatusTone(
                            o.status
                          )}`}
                        >
                          {humanizeShopStatus(o.status)}
                        </span>

                        <span className='font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                          سفارش #{Number(o.id).toLocaleString('fa-IR')}
                        </span>
                      </div>

                      <p className='mt-2 text-[10px] text-subtext-light dark:text-subtext-dark'>
                        تاریخ ثبت:{' '}
                        <span className='font-faNa font-bold text-text-light dark:text-text-dark'>
                          {formatDateFa(o.createdAt)}
                        </span>
                      </p>
                    </div>

                    <div className='flex items-center justify-between gap-3 sm:flex-col sm:items-end'>
                      <p className='font-faNa text-base font-black text-secondary'>
                        {formatToman(o.payableOnline)}
                      </p>

                      <button
                        type='button'
                        onClick={() => setOpenId(isOpen ? null : o.id)}
                        className='inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-secondary/15 bg-secondary/5 px-3 text-[9px] font-black text-secondary transition-all hover:bg-secondary/10'
                      >
                        {isOpen ? (
                          <HiOutlineChevronUp size={15} />
                        ) : (
                          <HiOutlineChevronDown size={15} />
                        )}
                        {isOpen ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                      </button>
                    </div>
                  </div>

                  {shouldShowTracking(o.status) && (
                    <div className='mt-4 rounded-2xl border border-black/5 bg-background-light/40 p-3 dark:border-white/10 dark:bg-background-dark/30'>
                      {o.trackingCode ? (
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <div className='flex items-center gap-2'>
                            <HiOutlineTruck size={17} className='text-secondary' />
                            <span className='text-[10px] font-bold text-text-light sm:text-xs dark:text-text-dark'>
                              کد رهگیری پستی
                            </span>
                          </div>

                          <button
                            type='button'
                            onClick={() => {
                              navigator.clipboard.writeText(o.trackingCode);
                              toast.showSuccessToast('کد رهگیری کپی شد');
                            }}
                            className='flex items-center gap-1.5 rounded-xl bg-surface-light/75 px-2.5 py-1.5 font-faNa text-[10px] font-black text-text-light transition hover:text-secondary dark:bg-surface-dark/65 dark:text-text-dark'
                          >
                            {o.trackingCode}
                            <MdContentCopy size={14} className='text-secondary' />
                          </button>
                        </div>
                      ) : (
                        <div className='flex items-center gap-2 text-[10px] text-red sm:text-xs'>
                          <HiOutlineInformationCircle size={16} />
                          کد رهگیری هنوز ثبت نشده است.
                        </div>
                      )}
                    </div>
                  )}

                  {isOpen && (
                    <div className='mt-4 border-t border-black/5 pt-4 dark:border-white/10'>
                      <div className='grid gap-2 sm:grid-cols-2'>
                        <div className='rounded-2xl bg-background-light/40 p-3 dark:bg-background-dark/30'>
                          <p className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                            روش ارسال
                          </p>
                          <p className='mt-1 text-[10px] font-black text-text-light sm:text-xs dark:text-text-dark'>
                            {o.shippingTitle || '—'}
                          </p>
                        </div>

                        <div className='rounded-2xl bg-background-light/40 p-3 dark:bg-background-dark/30'>
                          <p className='text-[9px] text-subtext-light dark:text-subtext-dark'>
                            هزینه ارسال
                          </p>
                          <p className='mt-1 font-faNa text-[10px] font-black text-text-light sm:text-xs dark:text-text-dark'>
                            {o.postOptionKey === 'FALLBACK_POST_FAST' &&
                            o.shippingCost === 0
                              ? 'به زودی محاسبه می شود.'
                              : o.shippingMethod === 'COURIER_COD'
                                ? 'در محل'
                                : `${formatToman(o.shippingCost)}`}
                          </p>
                        </div>
                      </div>

                      {Array.isArray(o.items) && o.items.length > 0 && (
                        <div className='mt-5'>
                          <div className='mb-3 flex items-center gap-2'>
                            <HiOutlineClipboardDocumentCheck
                              size={18}
                              className='text-secondary'
                            />
                            <h4 className='text-xs font-black text-text-light sm:text-sm dark:text-text-dark'>
                              اقلام سفارش
                            </h4>
                          </div>

                          <div className='space-y-3'>
                            {o.items.map((it) => (
                              <div
                                key={it.id}
                                className='rounded-[20px] border border-black/5 bg-background-light/35 p-3 dark:border-white/10 dark:bg-background-dark/25'
                              >
                                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                  <button
                                    type='button'
                                    className='flex min-w-0 items-center gap-3 text-right'
                                    onClick={() =>
                                      router.push(`/shop/products/${it.slug}`)
                                    }
                                  >
                                    <div className='relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark'>
                                      <Image
                                        src={it.coverImage}
                                        alt={it.title}
                                        fill
                                        sizes='80px'
                                        className='object-contain p-1.5'
                                      />
                                    </div>

                                    <div className='min-w-0'>
                                      <span className='line-clamp-2 text-[11px] font-black leading-6 text-text-light sm:text-xs dark:text-text-dark'>
                                        {it.title}
                                      </span>

                                      <div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
                                        <span className='rounded-lg bg-surface-light/70 px-2 py-1 font-faNa text-[9px] text-subtext-light dark:bg-surface-dark/60 dark:text-subtext-dark'>
                                          تعداد:{' '}
                                          {Number(it.qty || 0).toLocaleString(
                                            'fa-IR'
                                          )}
                                        </span>

                                        {it?.color?.name && (
                                          <span className='flex items-center gap-1 rounded-lg bg-surface-light/70 px-2 py-1 text-[9px] text-subtext-light dark:bg-surface-dark/60 dark:text-subtext-dark'>
                                            رنگ: {it.color.name}
                                            {it?.color?.hex && (
                                              <span
                                                className='h-2.5 w-2.5 rounded-full border border-black/10 dark:border-white/10'
                                                style={{
                                                  backgroundColor: it.color.hex,
                                                }}
                                                title={it.color.hex}
                                              />
                                            )}
                                          </span>
                                        )}

                                        {it?.size?.name && (
                                          <span className='rounded-lg bg-surface-light/70 px-2 py-1 text-[9px] text-subtext-light dark:bg-surface-dark/60 dark:text-subtext-dark'>
                                            سایز:{' '}
                                            <span className='font-faNa'>
                                              {it.size.name}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>

                                  <div className='flex shrink-0 items-end justify-between gap-3 sm:flex-col sm:justify-center'>
                                    <span className='whitespace-nowrap font-faNa text-xs font-black text-secondary'>
                                      {formatToman(it.unitPrice)}
                                    </span>
                                    {it.qty > 1 && (
                                      <span className='whitespace-nowrap font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                                        جمع:{' '}
                                        {formatToman(
                                          Number(it.unitPrice || 0) *
                                            Number(it.qty || 1)
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {it.returnRequest && (
                                  <div className='mt-3 rounded-2xl border border-secondary/10 bg-surface-light/55 p-3 text-[10px] dark:bg-surface-dark/45'>
                                    <div className='flex flex-wrap items-center justify-between gap-2'>
                                      <div>
                                        <p className='font-black text-text-light dark:text-text-dark'>
                                          درخواست مرجوعی
                                        </p>
                                        <p className='mt-1 font-faNa text-[9px] text-subtext-light dark:text-subtext-dark'>
                                          تاریخ ثبت درخواست:{' '}
                                          {formatDateFa(
                                            it.returnRequest.createdAt
                                          )}
                                        </p>
                                      </div>

                                      <span
                                        className={`rounded-xl border px-2.5 py-1.5 text-[9px] font-black ${
                                          RETURN_STATUS_META[
                                            it.returnRequest.status
                                          ]?.tone ||
                                          'border-black/10 bg-black/5 text-subtext-light dark:border-white/10 dark:bg-white/5 dark:text-subtext-dark'
                                        }`}
                                      >
                                        {RETURN_STATUS_META[
                                          it.returnRequest.status
                                        ]?.label || 'در حال بررسی'}
                                      </span>
                                    </div>

                                    <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                                      <div className='rounded-xl bg-background-light/45 p-2.5 dark:bg-background-dark/30'>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          دلیل:
                                        </span>{' '}
                                        <span className='font-bold text-text-light dark:text-text-dark'>
                                          {RETURN_REASON_LABEL[
                                            it.returnRequest.reason
                                          ] ||
                                            it.returnRequest.reason ||
                                            '—'}
                                        </span>
                                      </div>

                                      <div className='rounded-xl bg-background-light/45 p-2.5 dark:bg-background-dark/30'>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          تعداد:
                                        </span>{' '}
                                        <span className='font-faNa font-black text-text-light dark:text-text-dark'>
                                          {Number(
                                            it.returnRequest.qty || 1
                                          ).toLocaleString('fa-IR')}
                                        </span>
                                      </div>
                                    </div>

                                    {it.returnRequest.description ? (
                                      <div className='mt-2 rounded-xl bg-background-light/45 p-2.5 leading-6 text-text-light dark:bg-background-dark/30 dark:text-text-dark'>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          توضیحات شما:
                                        </span>{' '}
                                        {it.returnRequest.description}
                                      </div>
                                    ) : null}

                                    {it.returnRequest.adminNote ? (
                                      <div className='mt-2 rounded-xl border border-secondary/10 bg-secondary/5 p-2.5 leading-6 text-text-light dark:text-text-dark'>
                                        <span className='font-bold text-secondary'>
                                          پاسخ ادمین:
                                        </span>{' '}
                                        {it.returnRequest.adminNote}
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className='mt-4 flex flex-wrap justify-end gap-2 border-t border-black/5 pt-4 dark:border-white/10'>
                        {canCancelOrder(o) && (
                          <button
                            type='button'
                            className='inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red/15 bg-red/5 px-3 text-[10px] font-black text-red transition hover:bg-red/10 disabled:opacity-50'
                            onClick={() => {
                              setTempId(o.id);
                              setShowCancelModal(true);
                            }}
                            disabled={tempId === o.id}
                          >
                            <MdOutlineCancel size={16} />
                            لغو سفارش
                          </button>
                        )}

                        {canConfirmDelivery(o) && (
                          <SiteButton
                            type='button'
                            variant='primary'
                            size='md'
                            onClick={() => handleConfirmDelivery(o.id)}
                            disabled={actionLoadingId === o.id}
                          >
                            {actionLoadingId === o.id ? (
                              <span className='flex items-center gap-2'>
                                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                                در حال ثبت...
                              </span>
                            ) : (
                              <span className='flex items-center gap-2'>
                                <HiOutlineCheckCircle size={17} />
                                تحویل گرفتم
                              </span>
                            )}
                          </SiteButton>
                        )}

                        {canRequestReturn(o) && (
                          <button
                            type='button'
                            className='inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-blue/15 bg-blue/5 px-3 text-[10px] font-black text-blue transition hover:bg-blue/10'
                            onClick={() => {
                              setReturnOrder(o);
                              setShowReturnModal(true);
                            }}
                          >
                            <TbTruckReturn size={16} />
                            درخواست مرجوعی
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SiteCard>
            );
          })}

          {totalPages > 1 && (
            <div className='pt-3'>
              <Pagination
                currentPage={page}
                onPageChange={onPageChange}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      )}

      {showCancelModal && (
        <Modal
          title='لغو سفارش'
          desc='در صورتی که از لغو سفارش خود مطمئن هستید، تایید کنید. بعداز درخواست لغو، نهایتا ظرف ۲۴ ساعت با شما تماس گرفته خواهد شد و مراحل استرداد مبلغ به اطلاع شما خواهد رسید.'
          icon={MdOutlineCancel}
          primaryButtonText='انصراف'
          secondaryButtonText='تایید'
          primaryButtonClick={() => {
            setShowCancelModal(false);
            setTempId(null);
          }}
          secondaryButtonClick={handleCancel}
        />
      )}

      <ReturnRequestModal
        open={showReturnModal}
        order={returnOrder}
        toast={toast}
        onClose={() => {
          setShowReturnModal(false);
          setReturnOrder(null);
        }}
        onSuccess={async () => {
          await load(activeTab, page);
          await fetchCounts();
          setActiveTab('returned');
          setPage(1);
        }}
      />
    </div>
  );
}

SectionShopOrders.propTypes = {
  onCounts: PropTypes.func,
};
