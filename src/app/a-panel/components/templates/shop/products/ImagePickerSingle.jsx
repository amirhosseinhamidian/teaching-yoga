/* eslint-disable no-undef */
'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import Input from '@/components/Ui/Input/Input';
import Button from '@/components/Ui/Button/Button';
import ActionButtonIcon from '@/components/Ui/ActionButtonIcon/ActionButtonIcon';

import { LuTrash } from 'react-icons/lu';

import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import FileUploadModal from '../../../modules/FileUploadModal/FileUploadModal';
import Image from 'next/image';

function isValidHttpUrl(url) {
  return /^https?:\/\//i.test(String(url || '').trim());
}

const ImagePickerSingle = ({
  title = 'کاور محصول',
  label = 'لینک کاور',
  placeholder = 'https://...',
  value,
  onChange,
  folderPath,
  disabled = false,
  required = false,

  canUpload = true,
  blockedMessage = 'ابتدا عنوان محصول را وارد کنید.',
  previewSize = 64, // px
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [openUploadModal, setOpenUploadModal] = useState(false);

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
    formData.append('fileName', 'cover');

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

      onChange(fileUrl);
      toast.showSuccessToast('کاور با موفقیت آپلود شد.');
    } catch (e) {
      toast.showErrorToast('خطای غیرمنتظره در آپلود');
    } finally {
      setOpenUploadModal(false);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    onChange('');
  };

  const handleBlurValidate = () => {
    if (!value) return;
    if (!isValidHttpUrl(value)) {
      toast.showErrorToast('لینک تصویر باید با http یا https شروع شود.');
    }
  };

  const hasImage = !!String(value || '').trim();

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
            آپلود کاور
          </Button>

          {hasImage ? (
            <ActionButtonIcon
              color='red'
              icon={LuTrash}
              onClick={handleRemove}
              className='!h-9 !w-9'
            />
          ) : null}
        </div>
      </div>

      <Input
        label={`${label}${required ? ' (الزامی)' : ' (اختیاری)'}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={(v) => (!disabled ? onChange(v) : null)}
        onBlur={handleBlurValidate}
        className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
      />

      <div className='mt-3'>
        {hasImage ? (
          <div className='flex items-center gap-3 rounded-xl bg-foreground-light p-2 dark:bg-foreground-dark'>
            {/* Thumbnail */}
            <Image
              src={value}
              alt='cover'
              width={previewSize}
              height={previewSize}
              className='rounded-lg object-cover'
              onError={() =>
                toast.showErrorToast('پیش‌نمایش تصویر کاور قابل نمایش نیست.')
              }
            />

            <div className='flex-1'>
              <p className='text-xs text-subtext-light dark:text-subtext-dark'>
                کاور انتخاب شده است
              </p>
            </div>

            <button
              type='button'
              onClick={handleRemove}
              className='rounded-lg p-2 text-red hover:opacity-80'
              title='حذف کاور'
              disabled={disabled}
            >
              <LuTrash size={20} />
            </button>
          </div>
        ) : (
          <p className='text-xs text-subtext-light dark:text-subtext-dark'>
            هنوز تصویری برای کاور ثبت نشده است.
          </p>
        )}
      </div>

      {openUploadModal && (
        <FileUploadModal
          title='آپلود کاور محصول'
          desc='برای آپلود تصویر کاور فایل خود را در اینجا بکشید و رها کنید یا کلیک و انتخاب کنید.'
          onUpload={handleUpload}
          onClose={() => setOpenUploadModal(false)}
        />
      )}
    </div>
  );
};

ImagePickerSingle.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  folderPath: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  canUpload: PropTypes.bool,
  blockedMessage: PropTypes.string,
  previewSize: PropTypes.number,
};

export default ImagePickerSingle;
