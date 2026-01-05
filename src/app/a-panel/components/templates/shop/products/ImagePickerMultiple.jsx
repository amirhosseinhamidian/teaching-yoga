/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';

import { FiPlus } from 'react-icons/fi';
import { LuTrash } from 'react-icons/lu';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import FileUploadModal from '../../../modules/FileUploadModal/FileUploadModal';
import Image from 'next/image';

function isValidHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

const ImagePickerMultiple = ({
  title = 'تصاویر محصول (گالری)',
  values,
  onChange,
  folderPath,
  disabled = false,

  canUpload = true,
  blockedMessage = 'ابتدا عنوان محصول را وارد کنید.',
  previewSize = 84, // px
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const normalizedValues = Array.isArray(values) ? values.filter(Boolean) : [];

  const handleAddUrl = () => {
    if (disabled) return;

    const url = String(urlInput || '').trim();
    if (!url) return;

    if (!isValidHttpUrl(url)) {
      toast.showErrorToast('لینک تصویر باید با http یا https شروع شود.');
      return;
    }

    if (normalizedValues.includes(url)) {
      toast.showErrorToast('این تصویر قبلاً اضافه شده است.');
      return;
    }

    onChange([...normalizedValues, url]);
    setUrlInput('');
  };

  const handleRemove = (url) => {
    if (disabled) return;
    onChange(normalizedValues.filter((x) => x !== url));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const handleOpenUpload = () => {
    if (disabled) return;

    if (!canUpload) {
      toast.showErrorToast(blockedMessage);
      return;
    }

    if (!folderPath) {
      toast.showErrorToast('مسیر ذخیره‌سازی تصاویر مشخص نشده است.');
      return;
    }

    setOpenUploadModal(true);
  };

  const handleUpload = async (file) => {
    if (!file) {
      toast.showErrorToast('لطفاً یک تصویر انتخاب کنید.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderPath', folderPath);
    formData.append('fileName', `img_${Date.now()}`);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/image`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.showErrorToast(err?.error || 'خطا در آپلود تصویر');
        return;
      }

      const data = await res.json();
      const fileUrl = String(data?.fileUrl || '');

      if (!fileUrl) {
        toast.showErrorToast('آدرس تصویر از سرور دریافت نشد.');
        return;
      }

      if (!normalizedValues.includes(fileUrl)) {
        onChange([...normalizedValues, fileUrl]);
      }

      toast.showSuccessToast('تصویر با موفقیت آپلود شد.');
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
    } finally {
      setOpenUploadModal(false);
    }
  };

  return (
    <div className='w-full rounded-2xl border border-accent bg-surface-light p-4 dark:bg-surface-dark'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 className='text-sm font-semibold xs:text-base'>{title}</h2>

        <div className='flex items-center gap-2'>
          <Button
            shadow
            className='text-xs'
            onClick={handleOpenUpload}
            disabled={disabled || !canUpload}
          >
            آپلود تصویر جدید
          </Button>

          {normalizedValues.length > 0 ? (
            <Button
              shadow
              className='!bg-red text-xs'
              onClick={handleClearAll}
              disabled={disabled}
            >
              حذف همه
            </Button>
          ) : null}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='relative'>
          <Input
            label='افزودن با لینک'
            placeholder='https://...'
            value={urlInput}
            onChange={setUrlInput}
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <ActionButtonIcon
            icon={FiPlus}
            color='accent'
            className='absolute left-1 top-[39px]'
            onClick={handleAddUrl}
          />
        </div>

        <div className='flex items-end'>
          <p className='text-xs text-subtext-light dark:text-subtext-dark'>
            می‌تونی با لینک اضافه کنی یا از آپلود استفاده کنی.
          </p>
        </div>
      </div>

      {normalizedValues.length === 0 ? (
        <p className='mt-3 text-xs text-subtext-light dark:text-subtext-dark'>
          هنوز تصویری برای گالری ثبت نشده است.
        </p>
      ) : (
        <div className='mt-4 grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6'>
          {normalizedValues.map((url) => (
            <div
              key={url}
              className='group relative overflow-hidden rounded-xl bg-foreground-light p-2 dark:bg-foreground-dark'
            >
              <Image
                src={url}
                alt='product'
                width={previewSize}
                height={previewSize}
                className='w-full rounded-lg object-cover'
                onError={() =>
                  toast.showErrorToast('یکی از تصاویر گالری قابل نمایش نیست.')
                }
              />

              <button
                type='button'
                onClick={() => handleRemove(url)}
                disabled={disabled}
                className='absolute right-2 top-2 rounded-lg bg-white/90 p-1 text-red opacity-100 shadow-sm transition hover:opacity-90 dark:bg-black/60'
                title='حذف'
              >
                <LuTrash size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {openUploadModal && (
        <FileUploadModal
          title='آپلود تصویر محصول'
          desc='برای آپلود تصویر محصول فایل خود را در اینجا بکشید و رها کنید یا کلیک و انتخاب کنید.'
          onUpload={handleUpload}
          onClose={() => setOpenUploadModal(false)}
        />
      )}
    </div>
  );
};

ImagePickerMultiple.propTypes = {
  title: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  folderPath: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  canUpload: PropTypes.bool,
  blockedMessage: PropTypes.string,
  previewSize: PropTypes.number,
};

export default ImagePickerMultiple;
