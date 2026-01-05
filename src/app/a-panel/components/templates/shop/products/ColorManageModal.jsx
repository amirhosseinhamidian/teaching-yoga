/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/modules/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { LuTrash } from 'react-icons/lu';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { MdPalette } from 'react-icons/md';
import ColorSelect from '@/components/Ui/ColorSelect/ColorSelect';

function normalizeHex(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  return s.startsWith('#') ? s.toLowerCase() : `#${s.toLowerCase()}`;
}

function isValidHex(hex) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex);
}

export default function ColorManageModal({
  open,
  onClose,
  allColors,
  setAllColors,
  loadingColors,
  selectedIds,
  onConfirm,
  onNeedRefreshColors,
}) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  // انتخاب‌های داخل مودال (موقتی)
  const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds || []);

  // dropdown selection
  const [pickedColorId, setPickedColorId] = useState(null);

  // ساخت رنگ جدید
  const [newName, setNewName] = useState('');
  const [newHex, setNewHex] = useState('#000000');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setTempSelectedIds(selectedIds || []);
    }
  }, [open]);

  const tempSelectedList = useMemo(() => {
    return allColors.filter((c) => tempSelectedIds.includes(c.id));
  }, [allColors, tempSelectedIds]);

  const addExistingColor = () => {
    const id = Number(pickedColorId);
    if (!Number.isFinite(id) || id <= 0) return;

    if (tempSelectedIds.includes(id)) {
      toast.showErrorToast('این رنگ قبلاً انتخاب شده است.');
      return;
    }

    setTempSelectedIds((prev) => [...prev, id]);
    setPickedColorId(null);
  };

  const removeTemp = (id) => {
    setTempSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleHexInputChange = (val) => {
    const hex = normalizeHex(val);
    setNewHex(hex);
  };

  const handleColorPickerChange = (val) => {
    setNewHex(normalizeHex(val));
  };

  const createAndSelectNewColor = async () => {
    const name = String(newName || '').trim();
    const hex = normalizeHex(newHex);

    if (!name) {
      toast.showErrorToast('نام رنگ الزامی است.');
      return;
    }
    if (!isValidHex(hex)) {
      toast.showErrorToast('کد رنگ معتبر نیست. (مثال: #ffcc00)');
      return;
    }

    try {
      setCreating(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/colors`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, hex }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در ثبت رنگ');
        return;
      }

      // رنگ ساخته شده
      const created = data;

      // به لیست کل رنگ‌ها اضافه کن (برای dropdown و ...)
      setAllColors((prev) => {
        const exists = prev.some((x) => x.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });

      // به لیست انتخابی مودال اضافه کن
      setTempSelectedIds((prev) => {
        if (prev.includes(created.id)) return prev;
        return [...prev, created.id];
      });

      toast.showSuccessToast('رنگ جدید ثبت شد و به لیست انتخابی اضافه شد.');

      // پاکسازی فیلدهای ساخت رنگ
      setNewName('');
      setNewHex('#000000');

      // اگر لازم شد لیست را دوباره از سرور sync کنیم:
      if (onNeedRefreshColors) await onNeedRefreshColors();
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title='مدیریت رنگ‌های محصول'
      icon={MdPalette}
      iconSize={28}
      primaryButtonText='تایید و بستن'
      secondaryButtonText='انصراف'
      primaryButtonClick={() => onConfirm(tempSelectedIds)}
      secondaryButtonClick={onClose}
      desc='' // desc رو خالی گذاشتیم و از children استفاده می‌کنیم
      className=''
    >
      {/* انتخاب از رنگ‌های موجود */}
      <div className='space-y-3'>
        <h4 className='text-sm font-semibold'>انتخاب از رنگ‌های موجود</h4>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
          <div className='flex-1'>
            <ColorSelect
              label='لیست رنگ‌ها'
              placeholder={loadingColors ? 'در حال دریافت...' : 'انتخاب رنگ'}
              items={allColors}
              value={pickedColorId}
              onChange={setPickedColorId}
            />
          </div>

          <Button
            shadow
            className='whitespace-nowrap text-xs'
            onClick={addExistingColor}
            disabled={!pickedColorId}
          >
            افزودن به لیست
          </Button>
        </div>

        {/* لیست انتخاب شده در مودال */}
        {tempSelectedList.length === 0 ? (
          <p className='text-xs text-subtext-light dark:text-subtext-dark'>
            هنوز رنگی انتخاب نشده است.
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {tempSelectedList.map((c) => (
              <div
                key={c.id}
                className='flex items-center gap-2 rounded-lg bg-foreground-light px-3 py-2 text-xs dark:bg-foreground-dark'
              >
                <span
                  className='h-3 w-3 rounded-full border border-subtext-light dark:border-subtext-dark'
                  style={{
                    backgroundColor: isValidHex(normalizeHex(c.hex))
                      ? normalizeHex(c.hex)
                      : '#000',
                  }}
                  title={c.hex}
                />
                <span>{c.name}</span>
                <button
                  type='button'
                  onClick={() => removeTemp(c.id)}
                  className='text-red hover:opacity-80'
                  title='حذف'
                >
                  <LuTrash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className='my-4 border-t border-subtext-light/30 dark:border-subtext-dark/30' />

        {/* افزودن رنگ جدید */}
        <h4 className='text-sm font-semibold'>افزودن رنگ جدید</h4>

        <div className='flex items-end gap-3'>
          <div className='flex flex-col'>
            <label className='mb-2 text-xs font-medium text-subtext-light dark:text-subtext-dark'>
              انتخاب رنگ
            </label>
            <input
              type='color'
              value={isValidHex(newHex) ? normalizeHex(newHex) : '#000000'}
              onChange={(e) => handleColorPickerChange(e.target.value)}
              className='h-10 w-20 cursor-pointer rounded-lg border border-subtext-light bg-transparent dark:border-subtext-dark'
            />
          </div>

          <div className='flex-1'>
            <Button
              shadow
              className='text-xs'
              onClick={createAndSelectNewColor}
              isLoading={creating}
            >
              ثبت رنگ جدید
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Input
            label='نام رنگ'
            placeholder='مثال: آبی آسمانی'
            value={newName}
            onChange={setNewName}
            className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
          />

          <div className='relative'>
            <Input
              label='کد هگزا'
              placeholder='#1e90ff'
              value={newHex}
              onChange={handleHexInputChange}
              className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
            />
          </div>

          <p className='text-xs text-subtext-light sm:col-span-2 dark:text-subtext-dark'>
            اگر کد هگزا وارد کنید، رنگ داخل ColorPicker هم همزمان نمایش داده
            می‌شود و بالعکس.
          </p>
        </div>
      </div>
    </Modal>
  );
}

ColorManageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,

  allColors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      hex: PropTypes.string.isRequired,
    })
  ).isRequired,
  setAllColors: PropTypes.func.isRequired,
  loadingColors: PropTypes.bool,

  selectedIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onNeedRefreshColors: PropTypes.func,
};
