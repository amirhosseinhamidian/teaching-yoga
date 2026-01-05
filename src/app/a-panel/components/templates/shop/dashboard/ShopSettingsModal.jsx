/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '@/components/Ui/Input/Input';
import Modal from '@/components/modules/Modal/Modal';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import {
  HiOutlineShoppingBag,
  HiOutlineUsers,
  HiOutlineLockClosed,
  HiOutlineClock,
  HiOutlineTruck,
} from 'react-icons/hi2';

const VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'فعال برای همه کاربران' },
  { value: 'ADMIN_ONLY', label: 'فقط برای ادمین/مدیر' },
  { value: 'OFF', label: 'خاموش' },
];

const toIntOrNullSafe = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
};

const clampNonNegativeOrNull = (v) => {
  const n = toIntOrNullSafe(v);
  if (n === null) return null;
  return Math.max(0, n);
};

export default function ShopSettingsModal({
  open,
  onClose,
  initialData,
  onSave,
}) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    shopVisibility: initialData?.shopVisibility ?? 'ALL',
    shopLeadTimeDays: initialData?.shopLeadTimeDays ?? 1,

    // ✅ nullable ints
    postFallbackBaseCost: initialData?.postFallbackBaseCost ?? null,
    postFallbackCostPerKg: initialData?.postFallbackCostPerKg ?? null,
  });

  // sync when modal opens / initialData changes
  useEffect(() => {
    if (!open) return;
    setForm({
      shopVisibility: initialData?.shopVisibility ?? 'ALL',
      shopLeadTimeDays: initialData?.shopLeadTimeDays ?? 1,
      postFallbackBaseCost: initialData?.postFallbackBaseCost ?? null,
      postFallbackCostPerKg: initialData?.postFallbackCostPerKg ?? null,
    });
    setSaving(false);
  }, [open, initialData]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const visibilityHint = useMemo(() => {
    const v = String(form.shopVisibility || '').toUpperCase();
    if (v === 'OFF')
      return 'فروشگاه برای همه کاربران (حتی ادمین) در فرانت غیرفعال است.';
    if (v === 'ADMIN_ONLY')
      return 'فروشگاه فقط برای ادمین/مدیر قابل مشاهده است.';
    return 'فروشگاه برای همه کاربران فعال است.';
  }, [form.shopVisibility]);

  const VisibilityIcon = useMemo(() => {
    const v = String(form.shopVisibility || '').toUpperCase();
    if (v === 'OFF') return HiOutlineLockClosed;
    if (v === 'ADMIN_ONLY') return HiOutlineUsers;
    return HiOutlineShoppingBag;
  }, [form.shopVisibility]);

  const handleSave = async () => {
    const payload = {
      shopVisibility: String(form.shopVisibility || 'ALL').toUpperCase(),

      shopLeadTimeDays: Math.max(0, Number(form.shopLeadTimeDays || 0)),

      // ✅ nullable non-negative ints
      postFallbackBaseCost: clampNonNegativeOrNull(form.postFallbackBaseCost),
      postFallbackCostPerKg: clampNonNegativeOrNull(form.postFallbackCostPerKg),
    };

    // simple validation
    if (!['ALL', 'ADMIN_ONLY', 'OFF'].includes(payload.shopVisibility)) {
      toast.showErrorToast('وضعیت نمایش فروشگاه نامعتبر است.');
      return;
    }
    if (
      payload.shopLeadTimeDays === null ||
      Number.isNaN(payload.shopLeadTimeDays) ||
      payload.shopLeadTimeDays < 0
    ) {
      toast.showErrorToast('زمان آماده‌سازی باید عدد صحیح و >= 0 باشد.');
      return;
    }

    try {
      setSaving(true);
      await onSave(payload);
      toast.showSuccessToast('تنظیمات با موفقیت ذخیره شد');
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.showErrorToast('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title='تنظیمات فروشگاه'
      secondaryButtonClick={() => (!saving ? onClose?.() : null)}
      secondaryButtonText='انصراف'
      primaryButtonClick={handleSave}
      primaryButtonText={saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
    >
      <div className='flex flex-col gap-5'>
        <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
          {/* ✅ Shop Visibility */}
          <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <VisibilityIcon
                  size={18}
                  className='text-slate-600 dark:text-slate-300'
                />
                <span className='text-sm font-semibold'>
                  وضعیت نمایش فروشگاه
                </span>
              </div>
            </div>

            <DropDown
              label=''
              fullWidth
              options={VISIBILITY_OPTIONS}
              value={form.shopVisibility}
              onChange={(v) => handleChange('shopVisibility', v)}
              optionClassName='max-h-60 overflow-y-auto custom-scrollbar'
              placeholder='وضعیت فروشگاه را انتخاب کنید'
            />

            <p className='mt-2 text-[11px] text-slate-500 dark:text-slate-300'>
              {visibilityHint}
            </p>
          </div>

          {/* ✅ lead time */}
          <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
            <div className='mb-2 flex items-center gap-2'>
              <HiOutlineClock
                size={18}
                className='text-slate-600 dark:text-slate-300'
              />
              <span className='text-sm font-semibold'>
                زمان آماده‌سازی سفارش
              </span>
            </div>

            <Input
              label='حداقل زمان آماده‌سازی سفارش (روز)'
              type='number'
              min={0}
              value={form.shopLeadTimeDays}
              onChange={(v) => handleChange('shopLeadTimeDays', Number(v))}
              disabled={saving}
            />

            <p className='mt-2 text-[11px] text-slate-500 dark:text-slate-300'>
              این مقدار فقط برای نمایش/برنامه‌ریزی است و می‌تواند حتی وقتی
              فروشگاه خاموش است هم تنظیم شود.
            </p>
          </div>
        </div>

        {/* ✅ Fallback Shipping */}
        <div className='rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-surface-dark'>
          <div className='mb-2 flex items-center gap-2'>
            <HiOutlineTruck
              size={18}
              className='text-slate-600 dark:text-slate-300'
            />
            <span className='text-sm font-semibold'>
              پارامترهای محاسبه هزینه ارسال (Fallback)
            </span>
          </div>

          <p className='mb-5 mt-2 text-xs text-blue'>
            اگر در دریافت قیمت از سرویس ارسال مشکلی وجود داشته باشد، هزینه ارسال
            براساس پارامترهای زیر محاسبه می‌شود. اگر هر کدام از این فیلدها خالی
            (null) باشد، هزینه ارسال در لحظه خرید محاسبه نمی‌شود و به کاربر
            اطلاع داده می‌شود که مبلغ ارسال بعداً اعلام خواهد شد.
          </p>

          <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
            <Input
              label='هزینه ارسال پایه (تومان)'
              thousandSeparator
              min={0}
              className='text-sm'
              value={form.postFallbackBaseCost ?? ''}
              onChange={(v) =>
                handleChange(
                  'postFallbackBaseCost',
                  v === '' ? null : Number(v)
                )
              }
              disabled={saving}
              placeholder='مثلاً 50,000'
            />

            <Input
              label='هزینه هر کیلو (تومان)'
              thousandSeparator
              min={0}
              className='text-sm'
              value={form.postFallbackCostPerKg ?? ''}
              onChange={(v) =>
                handleChange(
                  'postFallbackCostPerKg',
                  v === '' ? null : Number(v)
                )
              }
              disabled={saving}
              placeholder='مثلاً 30,000'
            />
          </div>

          <p className='mt-3 text-[11px] text-subtext-light dark:text-subtext-dark'>
            فرمول: <span className='font-faNa'>هزینه پایه</span> +{' '}
            <span className='font-faNa'>
              (ceil(وزن به کیلو)) × هزینه هر کیلو
            </span>
            <br />
            اگر یکی از پارامترها خالی باشد، خروجی محاسبه «نامشخص» خواهد بود.
          </p>
        </div>
      </div>
    </Modal>
  );
}

ShopSettingsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    shopVisibility: PropTypes.oneOf(['OFF', 'ADMIN_ONLY', 'ALL']),
    shopLeadTimeDays: PropTypes.number,
    postFallbackBaseCost: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
    postFallbackCostPerKg: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.oneOf([null]),
    ]),
  }).isRequired,
};
