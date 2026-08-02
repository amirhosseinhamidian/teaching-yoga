/* eslint-disable no-undef */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';

import Button from '@/components/Ui/Button/Button';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';

import { PUBLIC, PURCHASED, REGISTERED } from '@/constants/videoAccessLevel';

const VIDEO_STAGE_LABELS = {
  idle: 'آماده آپلود',
  creating: 'در حال آماده‌سازی عملیات',
  uploading: 'در حال آپلود ویدئو',
  queued: 'در صف پردازش',
  processing: 'در حال تبدیل ویدئو',
  publishing: 'در حال انتشار ویدئو',
  ready: 'پردازش تکمیل شد',
  failed: 'پردازش ناموفق بود',
  cancelled: 'عملیات لغو شد',
};

const clampProgress = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const UploadSessionMediaModal = ({
  onClose,
  onUpload,
  mediaAccessLevel,
  mediaType,
  isUpdate = false,
  showAccessLevel = true,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const fileInputRef = useRef(null);
  const uploadControllerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [accessLevel, setAccessLevel] = useState(mediaAccessLevel || '');

  const [isLoading, setIsLoading] = useState(false);

  const [progress, setProgress] = useState(0);

  const [currentStage, setCurrentStage] = useState('idle');

  const [errorMessages, setErrorMessages] = useState({
    accessLevel: '',
  });

  const accessMediaOptions = [
    {
      label: 'عمومی',
      value: PUBLIC,
    },
    {
      label: 'ثبت نام',
      value: REGISTERED,
    },
    {
      label: 'خریداری',
      value: PURCHASED,
    },
  ];

  const validateInputs = () => {
    const errors = {};

    if (showAccessLevel && !accessLevel) {
      errors.accessLevel = 'سطح دسترسی را مشخص کنید.';
    }

    setErrorMessages(errors);

    return Object.keys(errors).length === 0;
  };

  const selectFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setCurrentStage('idle');
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isLoading) {
      return;
    }

    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openFilePicker = () => {
    if (isLoading) {
      return;
    }

    fileInputRef.current?.click();
  };

  const getCurrentStageLabel = () => {
    if (mediaType === 'VIDEO') {
      return VIDEO_STAGE_LABELS[currentStage] || 'در حال پردازش ویدئو';
    }

    if (currentStage === 'ready') {
      return 'آپلود صدا تکمیل شد';
    }

    return 'در حال آپلود صدا';
  };

  const handleUpload = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید.');

      return;
    }

    if (!file) {
      toast.showErrorToast('لطفاً یک فایل انتخاب کنید.');

      return;
    }

    const abortController = new AbortController();

    uploadControllerRef.current = abortController;

    setIsLoading(true);
    setProgress(0);
    setCurrentStage(mediaType === 'VIDEO' ? 'creating' : 'uploading');

    try {
      if (mediaType === 'VIDEO') {
        const result = await onUpload(file, accessLevel, {
          signal: abortController.signal,

          onProgress: (value) => {
            setProgress(clampProgress(value));
          },

          onStageChange: (stage) => {
            if (typeof stage === 'string' && stage.length > 0) {
              setCurrentStage(stage);
            }
          },
        });

        setCurrentStage('ready');
        setProgress(100);

        toast.showSuccessToast(result?.message || 'ویدئو با موفقیت ثبت شد.');

        uploadControllerRef.current = null;
        onClose();

        return;
      }

      await onUpload([file], false, accessLevel);

      setCurrentStage('ready');
      setProgress(100);

      uploadControllerRef.current = null;
      onClose();
    } catch (error) {
      if (error?.name === 'AbortError') {
        setCurrentStage('cancelled');

        toast.showErrorToast(
          mediaType === 'VIDEO' ? 'آپلود ویدئو لغو شد.' : 'آپلود صدا لغو شد.'
        );

        return;
      }

      setCurrentStage('failed');

      console.error('Media upload error:', error);

      toast.showErrorToast(
        error?.message || 'خطایی در آپلود فایل رخ داده است.'
      );
    } finally {
      uploadControllerRef.current = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      uploadControllerRef.current?.abort();
    };
  }, []);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative max-h-screen w-2/3 overflow-y-auto rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            {mediaType === 'VIDEO' ? 'آپلود ویدیو جلسه' : 'آپلود صدا جلسه'}
          </h3>

          <button
            type='button'
            onClick={onClose}
            disabled={isLoading}
            aria-label='بستن'
            className={isLoading ? 'cursor-not-allowed opacity-50' : ''}
          >
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>

        {showAccessLevel && (
          <div className='mt-6 grid grid-cols-1 gap-6'>
            <DropDown
              options={accessMediaOptions}
              placeholder='سطح دسترسی را مشخص کنید'
              value={accessLevel}
              onChange={(value) => {
                setAccessLevel(value);

                setErrorMessages((previous) => ({
                  ...previous,
                  accessLevel: '',
                }));
              }}
              errorMessage={errorMessages.accessLevel}
              label='سطح دسترسی'
              fullWidth
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
          </div>
        )}

        <p className='px-2 pb-1 pt-6 text-xs text-subtext-light xs:text-sm dark:text-subtext-dark'>
          {isUpdate
            ? `برای آپدیت ${
                mediaType === 'VIDEO' ? 'ویدیو' : 'صدا'
              } جلسه، فایل خود را در اینجا بکشید و رها کنید یا با کلیک انتخاب کنید. فایل قبلی به‌صورت خودکار جایگزین خواهد شد.`
            : `برای آپلود ${
                mediaType === 'VIDEO' ? 'ویدیو' : 'صدا'
              } جلسه، فایل خود را در اینجا بکشید و رها کنید یا با کلیک انتخاب کنید.`}
        </p>

        <div
          role='button'
          tabIndex={0}
          className={`mt-4 flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-accent bg-background-light text-center dark:bg-background-dark ${
            isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openFilePicker();
            }
          }}
        >
          <input
            type='file'
            accept={
              mediaType === 'VIDEO'
                ? 'video/*'
                : '.mp3,.m4a,.wav,.aac,.ogg,audio/*'
            }
            className='hidden'
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <div className='cursor-pointer'>
            {file ? (
              <>
                <p className='break-all px-4 text-sm text-text-light dark:text-text-dark'>
                  {file.name}
                </p>

                <p className='mt-2 text-xs text-subtext-light dark:text-subtext-dark'>
                  {(file.size / 1024 / 1024).toFixed(2)} مگابایت
                </p>
              </>
            ) : (
              <p className='text-sm text-subtext-light dark:text-subtext-dark'>
                {mediaType === 'VIDEO'
                  ? 'برای انتخاب ویدئو کلیک کنید'
                  : 'برای انتخاب فایل صوتی کلیک کنید'}
              </p>
            )}
          </div>
        </div>

        {isLoading && (
          <div>
            <div className='mt-4 h-3 w-full overflow-hidden rounded-full bg-foreground-light dark:bg-foreground-dark'>
              <div
                className='h-3 rounded-full bg-primary transition-[width] duration-300'
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className='mt-2 text-center font-faNa text-sm text-text-light dark:text-text-dark'>
              {`${getCurrentStageLabel()}: ${progress}%`}
            </div>
          </div>
        )}

        <p
          className={`mt-2 text-xs text-secondary sm:text-sm ${
            isLoading ? 'block' : 'hidden'
          }`}
        >
          تا پایان آپلود اولیه این پنجره را نبندید. پس از ورود ویدئو به صف،
          پردازش روی سرور انجام می‌شود.
        </p>

        <Button
          onClick={handleUpload}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isUpdate ? 'بروزرسانی' : 'ثبت جلسه'}
        </Button>
      </div>
    </div>
  );
};

UploadSessionMediaModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  mediaAccessLevel: PropTypes.string,
  mediaType: PropTypes.oneOf(['VIDEO', 'AUDIO']).isRequired,
  isUpdate: PropTypes.bool,
  showAccessLevel: PropTypes.bool,
};

export default UploadSessionMediaModal;
