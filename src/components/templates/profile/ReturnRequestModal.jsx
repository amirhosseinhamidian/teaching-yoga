/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { TbTruckReturn } from 'react-icons/tb';
import { IoClose } from 'react-icons/io5';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Input from '@/components/Ui/Input/Input';
import TextArea from '@/components/Ui/TextArea/TextArea';
import OutlineButton from '@/components/Ui/OutlineButton/OutlineButton';

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

  // ✅ DropDown شما value را با === مقایسه می‌کند، پس نوع را ثابت نگه می‌داریم (string)
  const [orderItemId, setOrderItemId] = useState(''); // string
  const [reason, setReason] = useState('DAMAGED'); // enum value
  const [qty, setQty] = useState(1);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ✅ options برای انتخاب محصول (value: string)
  const productOptions = useMemo(() => {
    return items.map((item) => ({
      label: `${item.title} (تعداد: ${Number(item.qty || 1).toLocaleString(
        'fa-IR'
      )})`,
      value: String(item.id),
    }));
  }, [items]);

  // ✅ options برای انتخاب دلیل مرجوعی (value: enum string)
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

  // ✅ وقتی مودال باز شد، ریست و انتخاب آیتم اول (اگر هست)
  useEffect(() => {
    if (!open) return;

    const firstItemId = items?.[0]?.id != null ? String(items[0].id) : '';
    setOrderItemId(firstItemId);
    setReason('DAMAGED');
    setQty(1);
    setDescription('');
    setSubmitting(false);
  }, [open, items]);

  // ✅ اگر کاربر محصول را عوض کرد، qty را معتبر نگه دار
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
            orderItemId: Number(orderItemId), // ✅ سرور عدد می‌خواهد
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
      onMouseDown={safeClose}
    >
      <div
        className='w-full max-w-lg rounded-2xl bg-surface-light p-4 shadow-xl dark:bg-surface-dark'
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='mb-4 flex items-center justify-between border-b border-gray-300 pb-4 pt-2 dark:border-gray-700'>
          <div className='flex items-center gap-2'>
            <TbTruckReturn size={24} />
            <h4 className='text-sm font-semibold lg:text-base'>
              درخواست مرجوعی
            </h4>
          </div>
          <button
            type='button'
            onClick={safeClose}
            className='rounded-lg px-2 py-1 text-sm text-slate-500 transition hover:bg-gray-100 dark:hover:bg-gray-800'
            disabled={submitting}
          >
            <IoClose
              size={24}
              className='text-subtext-light dark:text-subtext-dark'
            />
          </button>
        </div>

        {/* Body */}
        <div className='space-y-3 text-xs'>
          {/* ✅ Product DropDown */}
          <div>
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
              className={`bg-surface-light dark:bg-surface-dark ${submitting ? 'pointer-events-none opacity-70' : ''}`}
            />
          </div>

          {/* qty */}
          <div>
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
            <span className='mr-4 whitespace-nowrap text-[11px] text-subtext-light dark:text-subtext-dark'>
              حداکثر: <span className='font-faNa'>{maxQty}</span>
            </span>
          </div>

          {/* ✅ Reason DropDown */}
          <div>
            <DropDown
              label='دلیل مرجوعی'
              fullWidth
              value={reason}
              onChange={(value) => setReason(String(value))}
              options={reasonOptions}
              placeholder='دلیل مرجوعی را انتخاب کنید'
              className={submitting ? 'pointer-events-none opacity-70' : ''}
            />
          </div>

          {/* description */}
          <TextArea
            value={description}
            onChange={setDescription}
            rows={4}
            label='توضیحات تکمیلی (اختیاری)'
            className=''
            placeholder='مثلاً بسته‌بندی آسیب دیده بود یا سایز مناسب نبود...'
            disabled={submitting}
          />

          <p className='pt-1 text-[11px] text-slate-500'>
            توجه: پس از ثبت درخواست، سفارش به بخش «مرجوعی‌ها» منتقل می‌شود و پس
            از بررسی پشتیبانی نتیجه به شما اطلاع داده خواهد شد.
          </p>

          {/* actions */}
          <div className='mt-2 flex justify-end gap-2'>
            <OutlineButton
              variant='outline'
              className='text-xs'
              onClick={safeClose}
              disabled={submitting}
            >
              انصراف
            </OutlineButton>

            <Button
              shadow
              className='text-xs'
              onClick={submit}
              isLoading={submitting}
              disabled={items.length === 0 || !orderItemId}
            >
              ثبت درخواست
            </Button>
          </div>
        </div>
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
