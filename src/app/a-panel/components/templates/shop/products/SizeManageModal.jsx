/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Modal from '@/components/modules/Modal/Modal';
import Button from '@/components/Ui/Button/Button';
import Input from '@/components/Ui/Input/Input';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { LuTrash } from 'react-icons/lu';
import { FiPlus } from 'react-icons/fi';
import { TbRulerMeasure } from 'react-icons/tb';
import SizeSelect from '@/components/Ui/SizeSelect/SizeSelect';

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function SizeManageModal({
  open,
  onClose,
  allSizes,
  setAllSizes,
  loadingSizes,
  selectedIds,
  onConfirm,
  onNeedRefreshSizes,
}) {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds || []);
  const [pickedSizeId, setPickedSizeId] = useState(null);

  // افزودن سایز جدید
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setTempSelectedIds(selectedIds || []);
      setPickedSizeId(null);
    }
  }, [open]);

  const tempSelectedList = useMemo(() => {
    return allSizes.filter((s) => tempSelectedIds.includes(s.id));
  }, [allSizes, tempSelectedIds]);

  const addExistingSize = () => {
    const id = Number(pickedSizeId);
    if (!Number.isFinite(id) || id <= 0) return;

    if (tempSelectedIds.includes(id)) {
      toast.showErrorToast('این سایز قبلاً انتخاب شده است.');
      return;
    }

    setTempSelectedIds((prev) => [...prev, id]);
    setPickedSizeId(null);
  };

  const removeTemp = (id) => {
    setTempSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const createAndSelectNewSize = async () => {
    const name = String(newName || '').trim();
    if (!name) {
      toast.showErrorToast('نام سایز الزامی است.');
      return;
    }

    const slug = normalizeSlug(newSlug || name);

    try {
      setCreating(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/sizes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در ثبت سایز');
        return;
      }

      const created = data; // {id,name,slug}

      // اضافه به لیست کلی
      setAllSizes((prev) => {
        const exists = prev.some((x) => x.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });

      // اضافه به انتخاب‌های موقت
      setTempSelectedIds((prev) => {
        if (prev.includes(created.id)) return prev;
        return [...prev, created.id];
      });

      toast.showSuccessToast('سایز جدید ثبت شد و به لیست انتخابی اضافه شد.');

      setNewName('');
      setNewSlug('');

      if (onNeedRefreshSizes) await onNeedRefreshSizes();
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title='مدیریت سایزهای محصول'
      icon={TbRulerMeasure}
      iconSize={26}
      primaryButtonText='تایید و بستن'
      secondaryButtonText='انصراف'
      primaryButtonClick={() => onConfirm(tempSelectedIds)}
      secondaryButtonClick={onClose}
      desc=''
      className=''
    >
      <div className='space-y-3'>
        {/* انتخاب از موجودها */}
        <h4 className='text-sm font-semibold'>انتخاب از سایزهای موجود</h4>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
          <div className='flex-1'>
            <SizeSelect
              label='لیست سایزها'
              placeholder={loadingSizes ? 'در حال دریافت...' : 'انتخاب سایز'}
              items={allSizes}
              value={pickedSizeId}
              onChange={setPickedSizeId}
            />
          </div>

          <Button
            shadow
            className='whitespace-nowrap text-xs'
            onClick={addExistingSize}
            disabled={!pickedSizeId}
          >
            افزودن به لیست
          </Button>
        </div>

        {/* لیست انتخابی در مودال */}
        {tempSelectedList.length === 0 ? (
          <p className='text-xs text-subtext-light dark:text-subtext-dark'>
            هنوز سایزی انتخاب نشده است.
          </p>
        ) : (
          <div className='flex flex-wrap gap-2'>
            {tempSelectedList.map((s) => (
              <div
                key={s.id}
                className='flex items-center gap-2 rounded-lg bg-foreground-light px-3 py-2 text-xs dark:bg-foreground-dark'
              >
                <span className='font-faNa font-bold'>{s.name}</span>
                {!!s.slug && (
                  <span className='text-2xs text-subtext-light dark:text-subtext-dark'>
                    ({s.slug})
                  </span>
                )}
                <button
                  type='button'
                  onClick={() => removeTemp(s.id)}
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

        {/* افزودن سایز جدید */}
        <h4 className='text-sm font-semibold'>افزودن سایز جدید</h4>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <Input
            label='نام سایز'
            placeholder='مثال: مدیوم / 38 / XL'
            value={newName}
            onChange={setNewName}
            className='bg-surface-light text-xs text-text-light sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />

          <Input
            label='اسلاگ (اختیاری)'
            placeholder='مثال: m / 38 / xl'
            value={newSlug}
            onChange={setNewSlug}
            className='bg-surface-light text-xs text-text-light sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
        </div>

        <Button
          shadow
          className='mt-2 text-xs'
          onClick={createAndSelectNewSize}
          isLoading={creating}
        >
          <span className='flex items-center gap-2'>
            <FiPlus size={16} />
            ثبت سایز جدید
          </span>
        </Button>

        <p className='text-xs text-subtext-light dark:text-subtext-dark'>
          اگر اسلاگ را وارد نکنید، از روی نام سایز ساخته می‌شود.
        </p>
      </div>
    </Modal>
  );
}

SizeManageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,

  allSizes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      slug: PropTypes.string,
    })
  ).isRequired,
  setAllSizes: PropTypes.func.isRequired,
  loadingSizes: PropTypes.bool,

  selectedIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  onConfirm: PropTypes.func.isRequired,
  onNeedRefreshSizes: PropTypes.func,
};
