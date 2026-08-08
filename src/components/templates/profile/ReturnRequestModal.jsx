/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';
import TextArea from '@/components/Ui/TextArea/TextArea';

import SiteButton from '@/components/SiteUi/Button/SiteButton';
import SiteCard from '@/components/SiteUi/Card/SiteCard';

import {
  HiOutlineArrowUturnLeft,
  HiOutlineInformationCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { TbTruckReturn } from 'react-icons/tb';

const RETURN_REASONS = [
  { value: 'DAMAGED', label: 'خراب/آسیب‌دیده' },
  { value: 'WRONG_ITEM', label: 'ارسال اشتباه' },
  { value: 'SIZE_ISSUE', label: 'مشکل سایز' },
  { value: 'COLOR_ISSUE', label: 'مشکل رنگ' },
  { value: 'NOT_AS_DESCRIBED', label: 'مطابق توضیحات نبود' },
  { value: 'OTHER', label: 'سایر' },
];

export default function ReturnRequestModal({
  open,
  order,
  onClose,
  onSuccess,
  toast,
}) {
  const items = useMemo(() => {
    return Array.isArray(order?.items) ? order.items : [];
  }, [order]);

  const [orderItemId, setOrderItemId] = useState('');
  const [reason, setReason] = useState('DAMAGED');
  const [qty, setQty] = useState(1);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const productOptions = useMemo(() => {
    return items.map((item) => ({
      label: `${item.title} (تعداد: ${Number(item.qty || 1).toLocaleString(
        'fa-IR'
      )})`,
      value: String(item.id),
    }));
  }, [items]);

  const reasonOptions = useMemo(() => {
    return RETURN_REASONS.map((r) => ({
      label: r.label,
      value: r.value,
    }));
  }, []);

  const selectedItem = useMemo(() => {
    const idNum = Number(orderItemId);
    if (!idNum || Number.isNaN(idNum)) return null;
    return items.find((i) => Number(i.id) === idNum) || null;
  }, [orderItemId, items]);

  const maxQty = useMemo(() => {
    const q = Number(selectedItem?.qty || 1);
    return Number.isFinite(q) && q > 0 ? q : 1;
  }, [selectedItem]);

  useEffect(() => {
    if (!open) return;

    const firstItemId = items?.[0]?.id != null ? String(items[0].id) : '';
    setOrderItemId(firstItemId);
    setReason('DAMAGED');
    setQty(1);
    setDescription('');
    setSubmitting(false);
  }, [open, items]);

  useEffect(() => {
    setQty((prev) => {
      const n = Number(prev || 1);
      return Math.max(1, Math.min(n, maxQty));
    });
  }, [maxQty]);

  const safeClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const submit = async () => {
    if (!order?.id) {
      toast?.showErrorToast?.('سفارش نامعتبر است.');
      return;
    }
    if (!orderItemId) {
      toast?.showErrorToast?.('لطفاً محصول مورد نظر را انتخاب کنید.');
      return;
    }
    if (!reason) {
      toast?.showErrorToast?.('لطفاً دلیل مرجوعی را انتخاب کنید.');
      return;
    }

    const qtyNum = Math.max(1, Math.min(Number(qty || 1), maxQty));

    try {
      setSubmitting(true);

      const res = await fetch(
        `/api/profile/shop-orders/${order.id}/return-request`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderItemId: Number(orderItemId),
            reason,
            description: description?.trim() ? description.trim() : null,
            qty: qtyNum,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast?.showErrorToast?.(
          json?.error || json?.message || 'خطا در ثبت درخواست مرجوعی'
        );
        return;
      }

      toast?.showSuccessToast?.(
        json?.message || 'درخواست مرجوعی با موفقیت ثبت شد.'
      );

      onSuccess?.(json);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast?.showErrorToast?.('خطای ناشناخته در ثبت درخواست');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4'
      onMouseDown={safeClose}
    >
      <div
        className='w-full max-w-xl'
        onMouseDown={(e) => e.stopPropagation()}
      >
        <SiteCard
          variant='glass'
          padding='none'
          radius='lg'
          topLine
          className='max-h-[92dvh] overflow-y-auto rounded-b-none p-4 shadow-[0_-20px_70px_rgba(0,0,0,0.20)] sm:rounded-b-[28px] sm:p-5'
        >
          <div className='mb-5 flex items-start justify-between gap-3 border-b border-black/5 pb-4 dark:border-white/10'>
            <div className='flex items-center gap-3'>
              <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary'>
                <TbTruckReturn size={22} />
              </span>

              <div>
                <p className='text-[10px] font-bold text-secondary'>خدمات پس از خرید</p>
                <h4 className='mt-0.5 text-sm font-black text-text-light sm:text-base dark:text-text-dark'>
                  درخواست مرجوعی
                </h4>
              </div>
            </div>

            <button
              type='button'
              onClick={safeClose}
              disabled={submitting}
              className='flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-subtext-light transition-colors hover:bg-secondary/10 hover:text-secondary disabled:opacity-50 dark:bg-white/5 dark:text-subtext-dark'
            >
              <HiOutlineXMark size={20} />
            </button>
          </div>

          <div className='space-y-4 text-xs'>
            <DropDown
              label='محصول مورد نظر'
              fullWidth
              value={orderItemId}
              onChange={(value) => {
                setOrderItemId(String(value));
                setQty(1);
              }}
              options={productOptions}
              placeholder={
                items.length === 0
                  ? 'آیتمی یافت نشد'
                  : 'محصول مورد نظر را انتخاب کنید'
              }
              className={`bg-surface-light dark:bg-surface-dark ${
                submitting ? 'pointer-events-none opacity-70' : ''
              }`}
            />

            <div className='rounded-2xl border border-black/5 bg-background-light/40 p-3 dark:border-white/10 dark:bg-background-dark/30'>
              <Input
                type='number'
                label='تعداد مرجوعی'
                min={1}
                max={maxQty}
                fullWidth
                value={qty}
                onChange={(v) => {
                  setQty(Math.max(1, Math.min(v, maxQty)));
                }}
                disabled={submitting || !orderItemId}
              />

              <span className='mt-2 block text-[10px] text-subtext-light dark:text-subtext-dark'>
                حداکثر قابل انتخاب:{' '}
                <span className='font-faNa font-black text-text-light dark:text-text-dark'>
                  {maxQty}
                </span>
              </span>
            </div>

            <DropDown
              label='دلیل مرجوعی'
              fullWidth
              value={reason}
              onChange={(value) => setReason(String(value))}
              options={reasonOptions}
              placeholder='دلیل مرجوعی را انتخاب کنید'
              className={submitting ? 'pointer-events-none opacity-70' : ''}
            />

            <TextArea
              value={description}
              onChange={setDescription}
              rows={4}
              label='توضیحات تکمیلی (اختیاری)'
              placeholder='مثلاً بسته‌بندی آسیب دیده بود یا سایز مناسب نبود...'
              disabled={submitting}
            />

            <div className='flex items-start gap-2 rounded-2xl border border-secondary/10 bg-secondary/5 p-3 text-[10px] leading-6 text-subtext-light dark:text-subtext-dark'>
              <HiOutlineInformationCircle
                size={17}
                className='mt-0.5 shrink-0 text-secondary'
              />
              <p>
                پس از ثبت درخواست، سفارش به بخش «مرجوعی‌ها» منتقل می‌شود و پس
                از بررسی پشتیبانی نتیجه به شما اطلاع داده خواهد شد.
              </p>
            </div>

            <div className='flex flex-col-reverse gap-2 border-t border-black/5 pt-4 sm:flex-row sm:justify-end dark:border-white/10'>
              <SiteButton
                type='button'
                variant='outline'
                size='md'
                onClick={safeClose}
                disabled={submitting}
                className='w-full sm:w-auto'
              >
                انصراف
              </SiteButton>

              <SiteButton
                type='button'
                variant='primary'
                size='md'
                onClick={submit}
                disabled={submitting || items.length === 0 || !orderItemId}
                className='w-full sm:w-auto'
              >
                {submitting ? (
                  <span className='flex items-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    در حال ثبت...
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    <HiOutlineArrowUturnLeft size={17} />
                    ثبت درخواست
                  </span>
                )}
              </SiteButton>
            </div>
          </div>
        </SiteCard>
      </div>
    </div>
  );
}

ReturnRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        title: PropTypes.string,
        qty: PropTypes.number,
      })
    ),
  }),
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
  toast: PropTypes.shape({
    showSuccessToast: PropTypes.func,
    showErrorToast: PropTypes.func,
  }),
};
