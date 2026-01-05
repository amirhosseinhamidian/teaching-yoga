/* eslint-disable no-undef */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Modal from '@/components/modules/Modal/Modal';
import Input from '@/components/Ui/Input/Input';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import Button from '@/components/Ui/Button/Button';

import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

function normalizeCategorySlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CategoryFormModal = ({
  open,
  onClose,
  mode, // 'create' | 'edit'
  initialData, // {id,title,slug,parentId}
  allCategories, // لیست برای انتخاب parent
  onSuccess, // (savedCategory) => void
  isLoadingParents,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const isEdit = mode === 'edit';

  const [title, setTitle] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState(undefined);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // پر کردن فرم هنگام باز شدن
  useEffect(() => {
    if (!open) return;

    setTitle(initialData?.title || '');
    setSlugInput(initialData?.slug || '');
    setSlug(initialData?.slug || '');
    setParentId(
      initialData?.parentId != null ? Number(initialData.parentId) : undefined
    );
    setErrors({});
  }, [open, initialData]);

  // options برای parent
  const parentOptions = useMemo(() => {
    const list = Array.isArray(allCategories) ? allCategories : [];
    const filtered = isEdit
      ? list.filter((c) => c.id !== initialData?.id) // والد خودش نباشه
      : list;

    return [
      { label: 'بدون والد', value: '' },
      ...filtered.map((c) => ({ label: c.title, value: c.id })),
    ];
  }, [allCategories, isEdit, initialData?.id]);

  // اگر create و slug خالیه، از title تولید کن
  useEffect(() => {
    if (isEdit) return;
    if (slugInput && slugInput.trim().length > 0) return;
    if (!title.trim()) return;

    const next = normalizeCategorySlug(title);
    setSlug(next);
    setSlugInput(next);
  }, [title, slugInput, isEdit]);

  const handleSlugChange = (val) => {
    setSlugInput(val);
    const next = normalizeCategorySlug(val);
    setSlug(next);
  };

  const validate = () => {
    const next = {};

    if (!title.trim()) next.title = 'عنوان دسته‌بندی الزامی است.';
    if (!slug || slug.length < 3)
      next.slug = 'اسلاگ باید حداقل ۳ کاراکتر باشد.';

    // parentId (اختیاری)
    if (parentId != null && parentId !== undefined) {
      const n = Number(parentId);
      if (!Number.isFinite(n) || n <= 0) next.parentId = 'والد معتبر نیست.';
      if (isEdit && n === initialData?.id)
        next.parentId = 'دسته‌بندی نمی‌تواند والد خودش باشد.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید.');
      return;
    }

    setLoading(true);

    const payload = {
      title: title.trim(),
      slug: normalizeCategorySlug(slug || slugInput || title),
      parentId:
        parentId === '' || parentId == null || parentId === undefined
          ? null
          : Number(parentId),
    };

    try {
      let res;

      if (isEdit) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/categories/${initialData.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/shop/categories`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.showErrorToast(data?.error || 'خطا در ثبت دسته‌بندی');
        return;
      }

      toast.showSuccessToast(
        isEdit
          ? 'دسته‌بندی با موفقیت بروزرسانی شد.'
          : 'دسته‌بندی با موفقیت ساخته شد.'
      );

      onSuccess && onSuccess(data);
      onClose && onClose();
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <Modal
      title={isEdit ? 'ویرایش دسته‌بندی' : 'ساخت دسته‌بندی جدید'}
      desc='اطلاعات دسته‌بندی را وارد کنید.'
      secondaryButtonText='انصراف'
      primaryButtonText={isEdit ? 'بروزرسانی' : 'تایید'}
      secondaryButtonClick={onClose}
      primaryButtonClick={handleSubmit}
      loadingPrimaryButton={loading}
    >
      {/* اگر Modal کامپوننتت children می‌پذیره. اگر نمی‌پذیره بگو تا مطابقش کنم */}
      <div className='mt-4 grid grid-cols-1 gap-4'>
        <Input
          label='عنوان'
          placeholder='مثلاً تجهیزات کمکی یوگا'
          value={title}
          onChange={setTitle}
          errorMessage={errors.title}
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        />

        <Input
          label='اسلاگ'
          placeholder='مثلاً تجهیزات-کمکی-یوگا'
          value={slugInput}
          onChange={handleSlugChange}
          errorMessage={errors.slug}
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
        />

        <DropDown
          label='دسته‌بندی والد (اختیاری)'
          options={parentOptions}
          placeholder={
            isLoadingParents ? 'در حال دریافت دسته‌بندی‌ها...' : 'انتخاب کنید'
          }
          value={parentId ?? ''}
          onChange={(val) => setParentId(val === '' ? undefined : Number(val))}
          fullWidth
          errorMessage={errors.parentId}
          className='bg-surface-light text-text-light dark:bg-surface-dark dark:text-text-dark'
          optionClassName='max-h-72 overflow-y-auto custom-scrollbar'
        />
      </div>
    </Modal>
  );
};

CategoryFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialData: PropTypes.object,
  allCategories: PropTypes.array.isRequired,
  onSuccess: PropTypes.func,
  isLoadingParents: PropTypes.bool,
};

export default CategoryFormModal;
