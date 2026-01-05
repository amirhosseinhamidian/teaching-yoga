/* eslint-disable no-undef */
'use client';

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Button from '@/components/Ui/Button/Button';

import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCheck,
} from 'react-icons/hi2';
import TextArea from '@/components/Ui/TextArea/TextArea';

const toFa = (n) => Number(n || 0).toLocaleString('fa-IR');
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

const reasonFa = (r) => {
  const v = String(r || '').toUpperCase();
  switch (v) {
    case 'DAMAGED':
      return 'خراب/آسیب‌دیده';
    case 'WRONG_ITEM':
      return 'ارسال اشتباه';
    case 'SIZE_ISSUE':
      return 'مشکل سایز';
    case 'COLOR_ISSUE':
      return 'مشکل رنگ';
    case 'NOT_AS_DESCRIBED':
      return 'مطابق توضیحات نبود';
    case 'OTHER':
      return 'سایر';
    default:
      return r || '—';
  }
};

const statusFa = (s) => {
  const v = String(s || '').toUpperCase();
  switch (v) {
    case 'PENDING':
      return 'در انتظار بررسی';
    case 'APPROVED':
      return 'تایید شد';
    case 'REJECTED':
      return 'رد شد';
    case 'COMPLETED':
      return 'انجام شد';
    default:
      return s || '—';
  }
};

const statusBadgeClass = (s) => {
  const v = String(s || '').toUpperCase();
  if (v === 'PENDING')
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30';
  if (v === 'APPROVED')
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30';
  if (v === 'REJECTED')
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30';
  if (v === 'COMPLETED')
    return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30';
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

const ColorDot = ({ hex }) => {
  const bg = hex && /^#([0-9A-F]{3}){1,2}$/i.test(hex) ? hex : '#999';
  return (
    <span
      className='inline-block h-3 w-3 rounded-full ring-1 ring-black/10'
      style={{ background: bg }}
    />
  );
};
ColorDot.propTypes = { hex: PropTypes.string };

export default function AdminReturnRequestsCard({
  orderId,
  returnRequests,
  onRefresh,
  toast,
}) {
  const list = useMemo(
    () => (Array.isArray(returnRequests) ? returnRequests : []),
    [returnRequests]
  );

  const [loadingId, setLoadingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({}); // { [requestId]: 'text' }

  const patchStatus = async (requestId, status) => {
    try {
      setLoadingId(requestId);

      const adminNote = (noteDraft?.[requestId] || '').trim() || null;

      const res = await fetch(
        `/api/admin/shop/return-requests/${requestId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, adminNote }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast?.showErrorToast?.(
          json?.error || json?.message || 'خطا در بروزرسانی درخواست'
        );
        return;
      }

      toast?.showSuccessToast?.('بروزرسانی انجام شد.');
      onRefresh?.(); // دوباره سفارش را fetch کن
    } catch (e) {
      console.error(e);
      toast?.showErrorToast?.('خطای ناشناخته');
    } finally {
      setLoadingId(null);
    }
  };

  if (!list.length) {
    return (
      <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
        <h3 className='text-sm font-semibold'>درخواست‌ مرجوعی</h3>
        <p className='mt-3 text-sm text-slate-500 dark:text-slate-300'>
          درخواستی ثبت نشده است.
        </p>
      </div>
    );
  }

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-surface-dark'>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h3 className='text-sm font-semibold'>درخواست‌های مرجوعی</h3>
        <div className='text-xs text-slate-500 dark:text-slate-300'>
          سفارش #{toFa(orderId)}
        </div>
      </div>

      <div className='space-y-3'>
        {list.map((r) => {
          const item = r?.orderItem || null;

          return (
            <div
              key={r.id}
              className='rounded-xl border border-gray-200 p-3 dark:border-gray-700'
            >
              {/* top */}
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <Image
                    src={item?.coverImage || '/images/no-image.png'}
                    alt={item?.title || 'item'}
                    width={80}
                    height={60}
                    className='h-14 w-16 rounded-lg object-cover'
                  />

                  <div className='flex flex-col gap-1'>
                    <div className='text-sm font-semibold'>
                      {item?.title || '—'}
                    </div>

                    <div className='flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300'>
                      <span>
                        تعداد در سفارش:{' '}
                        <span className='font-faNa'>
                          {toFa(item?.qty || 0)}
                        </span>
                      </span>
                      <span>
                        تعداد مرجوعی:{' '}
                        <span className='font-faNa'>{toFa(r?.qty || 1)}</span>
                      </span>

                      {item?.color ? (
                        <span className='inline-flex items-center gap-1'>
                          رنگ:
                          <ColorDot hex={item.color.hex} />
                          <span>{item.color.name}</span>
                        </span>
                      ) : item?.colorId ? (
                        <span>رنگ: #{toFa(item.colorId)}</span>
                      ) : null}

                      {item?.size ? (
                        <span>
                          سایز:{' '}
                          <span className='font-faNa'>{item.size.name}</span>
                        </span>
                      ) : item?.sizeId ? (
                        <span>سایز: #{toFa(item.sizeId)}</span>
                      ) : null}
                    </div>

                    <div className='text-[11px] text-slate-500 dark:text-slate-300'>
                      دلیل:{' '}
                      <span className='font-semibold'>
                        {reasonFa(r.reason)}
                      </span>
                    </div>

                    <div className='text-[11px] text-slate-500 dark:text-slate-300'>
                      ثبت شده:{' '}
                      <span className='font-faNa'>
                        {formatDateFa(r.createdAt)}
                      </span>
                      {' · '}
                      بروزرسانی:{' '}
                      <span className='font-faNa'>
                        {formatDateFa(r.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <Badge className={statusBadgeClass(r.status)}>
                  {statusFa(r.status)}
                </Badge>
              </div>

              {/* description */}
              {r.description ? (
                <div className='mt-3 w-fit rounded-xl bg-gray-50 p-3 text-xs leading-relaxed dark:bg-foreground-dark/30'>
                  {r.description}
                </div>
              ) : null}

              {/* admin note */}
              <div className='mt-3'>
                <label className='mb-1 block text-xs text-slate-500 dark:text-slate-300'>
                  یادداشت ادمین
                </label>
                <TextArea
                  rows={2}
                  value={noteDraft?.[r.id] ?? (r.adminNote || '')}
                  onChange={(v) => setNoteDraft((p) => ({ ...p, [r.id]: v }))}
                  className='resize-none text-sm'
                  placeholder='مثلاً: لطفاً عکس آسیب‌دیدگی را ارسال کنید...'
                  disabled={loadingId === r.id}
                />
              </div>

              {/* actions */}
              <div className='mt-3 flex flex-wrap justify-end gap-2'>
                <Button
                  variant='outline'
                  className='flex items-center gap-1 text-xs sm:text-sm'
                  onClick={() => patchStatus(r.id, 'PENDING')}
                  shadow
                >
                  <HiOutlineClock size={18} />
                  در انتظار
                </Button>

                <Button
                  shadow
                  className='flex items-center gap-1 text-xs sm:text-sm'
                  onClick={() => patchStatus(r.id, 'APPROVED')}
                >
                  <HiOutlineCheckCircle size={18} />
                  تایید
                </Button>

                <Button
                  variant='outline'
                  className='flex items-center gap-1 text-xs sm:text-sm'
                  onClick={() => patchStatus(r.id, 'REJECTED')}
                  shadow
                >
                  <HiOutlineXCircle size={18} />
                  رد
                </Button>

                <Button
                  shadow
                  className='flex items-center gap-1 text-xs sm:text-sm'
                  onClick={() => patchStatus(r.id, 'COMPLETED')}
                >
                  <HiOutlineCheck size={18} />
                  تکمیل
                </Button>
              </div>

              <p className='mt-2 text-[11px] text-slate-500 dark:text-slate-300'>
                نکته: با تایید/درانتظار/تکمیل، وضعیت سفارش «مرجوعی» می‌ماند. اگر
                همه درخواست‌ها «رد» شوند، سفارش به «تکمیل شده» برمی‌گردد.
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

AdminReturnRequestsCard.propTypes = {
  orderId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  returnRequests: PropTypes.array,
  onRefresh: PropTypes.func,
  toast: PropTypes.shape({
    showSuccessToast: PropTypes.func,
    showErrorToast: PropTypes.func,
  }),
};
