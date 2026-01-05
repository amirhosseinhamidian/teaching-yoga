/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Button from '@/components/Ui/Button/Button';
import { ImSpinner2 } from 'react-icons/im';
import {
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineArrowUturnLeft,
} from 'react-icons/hi2';
import Pagination from '@/components/Ui/Pagination/Pagination';
import Image from 'next/image';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';
import { MdContentCopy, MdOutlineCancel } from 'react-icons/md';
import Modal from '@/components/modules/Modal/Modal';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { useRouter } from 'next/navigation';
import ReturnRequestModal from './ReturnRequestModal';
import { TbTruckReturn } from 'react-icons/tb';
import PropTypes from 'prop-types';

const PER_PAGE = 5;

const TABS = [
  { key: 'preparing', title: 'در حال آماده‌سازی', icon: HiOutlineClock },
  { key: 'shipped', title: 'ارسال شده', icon: HiOutlineTruck },
  { key: 'delivered', title: 'تکمیل شده', icon: HiOutlineCheckCircle },
  { key: 'cancelled', title: 'لغو شده', icon: HiOutlineXCircle },
  { key: 'returned', title: 'مرجوعی', icon: HiOutlineArrowUturnLeft },
];

const RETURN_STATUS_META = {
  PENDING: { label: 'در انتظار بررسی', tone: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'تایید شده', tone: 'bg-sky-100 text-sky-700' },
  REJECTED: { label: 'رد شده', tone: 'bg-rose-100 text-rose-700' },
  COMPLETED: {
    label: 'مرجوعی انجام شد',
    tone: 'bg-emerald-100 text-emerald-700',
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
      // در صورت خطا فقط مقدارها را صفر نگه می‌داریم
    } finally {
      setCountsLoading(false);
    }
  };

  // ✅ با تغییر تب: صفحه 1 و بسته شدن جزئیات
  useEffect(() => {
    setOpenId(null);
    setPage(1);
    load(activeTab, 1);
  }, [activeTab]);

  // ✅ با تغییر صفحه: دوباره load
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
      // بعد از تغییر وضعیت، لیست همان تب را با همان صفحه refresh کن
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

      // منطقیه بعد تایید تحویل، تب تکمیل شده رو باز کنیم
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
      {/* Header */}
      <h3 className='mb-4 text-sm font-semibold sm:text-base'>
        سفارشات فروشگاه
      </h3>

      {/* Tabs */}
      <div className='hide-scrollbar mb-4 flex w-full flex-wrap gap-2 overflow-x-auto'>
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          const count = Number(tabCounts?.[t.key] || 0);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-xl border p-1 text-2xs transition-all xs:text-xs md:text-sm lg:p-2 ${
                isActive
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-gray-200 text-slate-700 dark:border-gray-700 dark:bg-surface-dark dark:text-slate-200'
              }`}
            >
              <Icon
                size={18}
                className={isActive ? 'text-secondary' : 'text-subtext-light'}
              />
              <span>{t.title}</span>
              {!countsLoading && (
                <span
                  className={`mr-1 rounded-md px-2 font-faNa text-xs ${
                    isActive
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-slate-700 dark:bg-foreground-dark/40 dark:text-slate-200'
                  }`}
                >
                  {count.toLocaleString('fa-IR')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading ? (
        <div className='my-10 flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl'>
          <ImSpinner2 size={34} className='animate-spin text-secondary' />
          <p className='text-sm'>در حال دریافت سفارش‌ها...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className='my-10 flex h-40 w-full items-center justify-center rounded-xl text-sm'>
          سفارشی در این وضعیت وجود ندارد.
        </div>
      ) : (
        <div className='space-y-3'>
          {orders.map((o) => {
            const isOpen = openId === o.id;

            return (
              <div
                key={o.id}
                className='rounded-xl border border-gray-200 p-4 dark:border-gray-700'
              >
                {/* top row */}
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='flex flex-col gap-1'>
                    <div className='text-sm font-semibold'>
                      وضعیت: {humanizeShopStatus(o.status)}
                    </div>
                    <div className='text-[11px] text-subtext-light dark:text-subtext-dark'>
                      تاریخ ثبت:{' '}
                      <span className='font-faNa'>
                        {formatDateFa(o.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className='flex flex-col items-end gap-3'>
                    <OutlineButton
                      onClick={() => setOpenId(isOpen ? null : o.id)}
                      className='rounded-md border px-1 py-0.5 text-2xs'
                      color='blue'
                    >
                      {isOpen ? 'بستن جزئیات' : 'مشاهده جزئیات'}
                    </OutlineButton>
                    <div className='font-faNa text-sm font-semibold'>
                      {formatToman(o.payableOnline)}
                    </div>
                  </div>
                </div>

                {/* tracking */}
                {shouldShowTracking(o.status) && (
                  <div className='mt-3'>
                    {o.trackingCode ? (
                      <div className='flex items-center gap-1 text-sm text-subtext-light md:text-base dark:text-subtext-dark'>
                        <span>کد رهگیری پستی:</span>

                        <button
                          type='button'
                          onClick={() => {
                            navigator.clipboard.writeText(o.trackingCode);
                            toast.showSuccessToast('کد رهگیری کپی شد');
                          }}
                          className='flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-gray-100 dark:hover:bg-gray-800'
                        >
                          <span className='font-faNa'>{o.trackingCode}</span>
                          <MdContentCopy size={14} className='opacity-70' />
                        </button>
                      </div>
                    ) : (
                      <span className='text-xs text-red'>
                        کد رهگیری هنوز ثبت نشده است.
                      </span>
                    )}
                  </div>
                )}

                {/* details */}
                {isOpen && (
                  <div className='mt-4 rounded-xl bg-foreground-light/30 p-4 text-xs dark:bg-foreground-dark/30'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <div>
                        <span className='text-subtext-light dark:text-subtext-dark'>
                          روش ارسال:
                        </span>{' '}
                        <span>{o.shippingTitle || '—'}</span>
                      </div>
                      <div>
                        <span className='text-subtext-light dark:text-subtext-dark'>
                          هزینه ارسال:
                        </span>{' '}
                        <span className='font-faNa'>
                          {o.postOptionKey === 'FALLBACK_POST_FAST' &&
                          o.shippingCost === 0
                            ? 'به زودی محاسبه می شود.'
                            : o.shippingMethod === 'COURIER_COD'
                              ? 'در محل'
                              : `${formatToman(o.shippingCost)}`}
                        </span>
                      </div>
                    </div>

                    {/* items list */}
                    {Array.isArray(o.items) && o.items.length > 0 && (
                      <div className='mt-3 border-t border-gray-200 pt-3 dark:border-gray-700'>
                        <div className='mb-2 text-sm font-semibold'>
                          اقلام سفارش
                        </div>
                        <div className='space-y-3 md:space-y-6'>
                          {o.items.map((it) => (
                            <div key={it.id}>
                              <div className='flex items-center justify-between gap-4'>
                                <div
                                  className='flex cursor-pointer items-center gap-2'
                                  onClick={() =>
                                    router.push(`/shop/products/${it.slug}`)
                                  }
                                >
                                  <Image
                                    src={it.coverImage}
                                    alt={it.title}
                                    width={64}
                                    height={48}
                                    className='rounded-lg object-cover'
                                  />
                                  <div className='flex flex-col'>
                                    <span className='text-sm'>{it.title}</span>
                                    <div className='mt-1 flex flex-wrap items-center gap-1.5'>
                                      <span className='rounded-lg bg-foreground-light px-2 py-0.5 font-faNa text-2xs text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
                                        تعداد:{' '}
                                        {Number(it.qty || 0).toLocaleString(
                                          'fa-IR'
                                        )}
                                      </span>

                                      {/* رنگ */}
                                      {it?.color?.name && (
                                        <span className='flex items-center gap-1 rounded-lg bg-foreground-light px-2 py-0.5 text-2xs text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
                                          <span>رنگ:</span>
                                          <span className='font-faNa'>
                                            {it.color.name}
                                          </span>
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

                                      {/* سایز */}
                                      {it?.size?.name && (
                                        <span className='rounded-lg bg-foreground-light px-2 py-0.5 text-2xs text-subtext-light dark:bg-foreground-dark dark:text-subtext-dark'>
                                          سایز:{' '}
                                          <span className='font-faNa'>
                                            {it.size.name}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className='flex flex-col items-end'>
                                  <span className='whitespace-nowrap font-faNa text-xs'>
                                    {formatToman(it.unitPrice)}
                                  </span>
                                  {it.qty > 1 && (
                                    <span className='whitespace-nowrap font-faNa text-[11px] text-subtext-light dark:text-subtext-dark'>
                                      جمع:{' '}
                                      {formatToman(
                                        Number(it.unitPrice || 0) *
                                          Number(it.qty || 1)
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className='mt-4 w-full md:mt-8 xl:w-1/2'>
                                {it.returnRequest && (
                                  <div className='mt-2 rounded-xl border border-gray-200 bg-foreground-light/60 p-3 text-[11px] dark:border-gray-700 dark:bg-foreground-dark/60'>
                                    {/* status badge */}
                                    <h4 className='mb-3 text-xs font-medium text-blue sm:text-sm'>
                                      درخواست مرجوعی
                                    </h4>
                                    <div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
                                      <span
                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                                          RETURN_STATUS_META[
                                            it.returnRequest.status
                                          ]?.tone || 'bg-gray-100 text-gray-700'
                                        }`}
                                      >
                                        {RETURN_STATUS_META[
                                          it.returnRequest.status
                                        ]?.label || 'در حال بررسی'}
                                      </span>

                                      <span className='text-subtext-light dark:text-subtext-dark'>
                                        تاریخ ثبت درخواست:{' '}
                                        <span className='font-faNa'>
                                          {formatDateFa(
                                            it.returnRequest.createdAt
                                          )}
                                        </span>
                                      </span>
                                    </div>

                                    {/* details grid */}
                                    <div className='flex items-center justify-between gap-3'>
                                      <div>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          دلیل:
                                        </span>{' '}
                                        <span className='font-semibold'>
                                          {RETURN_REASON_LABEL[
                                            it.returnRequest.reason
                                          ] ||
                                            it.returnRequest.reason ||
                                            '—'}
                                        </span>
                                      </div>

                                      <div>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          تعداد:
                                        </span>{' '}
                                        <span className='font-faNa font-semibold'>
                                          {Number(
                                            it.returnRequest.qty || 1
                                          ).toLocaleString('fa-IR')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* user description */}
                                    {it.returnRequest.description ? (
                                      <div className='mt-2 rounded-lg bg-foreground-light p-2 text-slate-700 dark:bg-foreground-dark dark:text-slate-200'>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          توضیحات شما:
                                        </span>{' '}
                                        {it.returnRequest.description}
                                      </div>
                                    ) : null}

                                    {/* admin note (optional) */}
                                    {it.returnRequest.adminNote ? (
                                      <div className='mt-2 rounded-lg bg-foreground-light p-2 text-slate-700 dark:bg-foreground-dark dark:text-slate-200'>
                                        <span className='text-subtext-light dark:text-subtext-dark'>
                                          پاسخ ادمین:
                                        </span>{' '}
                                        {it.returnRequest.adminNote}
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* actions */}
                    <div className='mt-4 flex flex-wrap justify-end gap-2'>
                      {canCancelOrder(o) && (
                        <button
                          className='flex items-center gap-0.5 text-2xs text-red md:text-xs'
                          onClick={() => {
                            setTempId(o.id);
                            setShowCancelModal(true);
                          }}
                          disabled={tempId === o.id}
                        >
                          <MdOutlineCancel size={16} /> لغو سفارش
                        </button>
                      )}

                      {canConfirmDelivery(o) && (
                        <Button
                          shadow
                          className='text-xs'
                          onClick={() => handleConfirmDelivery(o.id)}
                          isLoading={actionLoadingId === o.id}
                        >
                          تحویل گرفتم
                        </Button>
                      )}

                      {canRequestReturn(o) && (
                        <button
                          className='flex items-center gap-0.5 text-2xs text-blue md:text-xs'
                          onClick={() => {
                            setReturnOrder(o);
                            setShowReturnModal(true);
                          }}
                        >
                          <TbTruckReturn size={16} /> درخواست مرجوعی
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ✅ pagination component شما */}
          {totalPages > 1 && (
            <div className='pt-4'>
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
          // refresh list
          await load(activeTab, page);
          await fetchCounts();
          // اگر خواستی مستقیم تب returned باز بشه:
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
