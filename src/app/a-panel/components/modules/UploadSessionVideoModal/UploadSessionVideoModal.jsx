/* eslint-disable no-undef */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Button from '@/components/Ui/Button/Button';
import AdaptiveDialog from '@/components/Ui/AdaptiveDialog/AdaptiveDialog';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { useTheme } from '@/contexts/ThemeContext';
import { createToastHandler } from '@/utils/toastHandler';
import { cancelAdminVideoJob } from '@/server/videoJobClient';

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

const formatBytes = (value) => {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }

  const megabytes = bytes / 1024 / 1024;

  if (megabytes < 1024) {
    return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
  }

  const gigabytes = megabytes / 1024;

  return `${gigabytes.toFixed(gigabytes >= 10 ? 1 : 2)} GB`;
};

const formatUploadSpeed = (value) => {
  const bytesPerSecond = Number(value);

  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) {
    return 'در حال محاسبه';
  }

  return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
};

const formatEta = (value) => {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) {
    return 'در حال محاسبه';
  }

  if (seconds < 60) {
    return `${Math.max(1, Math.ceil(seconds))} ثانیه`;
  }

  const totalMinutes = Math.ceil(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} دقیقه`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} ساعت و ${minutes} دقیقه` : `${hours} ساعت`;
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
  const cancelRequestedRef = useRef(false);

  const [file, setFile] = useState(null);
  const [accessLevel, setAccessLevel] = useState(mediaAccessLevel || '');
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [progress, setProgress] = useState(0);
  const [uploadMetrics, setUploadMetrics] = useState(null);

  const [currentStage, setCurrentStage] = useState('idle');

  const [errorMessages, setErrorMessages] = useState({
    accessLevel: '',
  });

  const isOperationLocked =
    isLoading || isCancelling || Boolean(activeJobId);

  const canCancelVideoJob =
    mediaType === 'VIDEO' &&
    Boolean(activeJobId) &&
    ['uploading', 'queued', 'failed'].includes(currentStage);

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
    setUploadMetrics(null);
    setCurrentStage('idle');
    setUploadError('');
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isOperationLocked) {
      return;
    }

    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const openFilePicker = () => {
    if (isOperationLocked) {
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

  const closeDialog = () => {
    setIsDialogOpen(false);

    setTimeout(() => {
      onClose();
    }, 240);
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
    cancelRequestedRef.current = false;

    setActiveJobId(null);
    setUploadError('');
    setIsLoading(true);
    setProgress(0);
    setUploadMetrics(null);
    setCurrentStage(mediaType === 'VIDEO' ? 'creating' : 'uploading');

    try {
      if (mediaType === 'VIDEO') {
        /*
         * Upload واقعی توسط GlobalVideoUploadProvider مدیریت می‌شود.
         * این Modal فقط task را ایجاد می‌کند و بلافاصله می‌تواند بسته شود.
         */
        const result = await onUpload(file, accessLevel);

        setCurrentStage('queued');
        setProgress(0);
        setUploadMetrics(null);

        toast.showSuccessToast(
          result?.message ||
            'آپلود و پردازش ویدئو در پس‌زمینه آغاز شد.'
        );

        uploadControllerRef.current = null;
        setActiveJobId(null);
        closeDialog();

        return;
      }

      await onUpload([file], false, accessLevel);

      setCurrentStage('ready');
      setProgress(100);

      uploadControllerRef.current = null;
      closeDialog();
    } catch (error) {
      if (error?.name === 'AbortError') {
        setCurrentStage('cancelled');

        if (!cancelRequestedRef.current) {
          toast.showErrorToast(
            mediaType === 'VIDEO'
              ? 'آپلود ویدئو لغو شد.'
              : 'آپلود صدا لغو شد.'
          );
        }

        return;
      }

      const message =
        error?.message || 'خطایی در آپلود فایل رخ داده است.';

      setCurrentStage('failed');
      setUploadError(message);

      console.error('Media upload error:', error);

      toast.showErrorToast(message);
    } finally {
      uploadControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleCancelVideoJob = async () => {
    if (!canCancelVideoJob || isCancelling) {
      return;
    }

    const jobId = activeJobId;

    cancelRequestedRef.current = true;
    setIsCancelling(true);
    uploadControllerRef.current?.abort();

    try {
      await cancelAdminVideoJob({
        jobId,
      });

      setActiveJobId(null);
      setCurrentStage('cancelled');
      setProgress(0);
      setUploadMetrics(null);
      setUploadError('');

      toast.showSuccessToast(
        'عملیات آپلود ویدئو متوقف و پاک‌سازی شد.'
      );
    } catch (error) {
      const stoppedStatus = error?.data?.job?.status;

      const isAlreadyStopped =
        error?.status === 409 &&
        ['FAILED', 'CANCELLED'].includes(stoppedStatus);

      if (isAlreadyStopped) {
        setActiveJobId(null);
        setCurrentStage('cancelled');
        setProgress(0);
        setUploadError('');

        toast.showSuccessToast('عملیات ویدئو متوقف شده است.');
      } else {
        const message =
          error?.message || 'لغو عملیات ویدئو با خطا مواجه شد.';

        setUploadError(message);
        toast.showErrorToast(message);
      }
    } finally {
      uploadControllerRef.current = null;
      cancelRequestedRef.current = false;
      setIsLoading(false);
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    return () => {
      uploadControllerRef.current?.abort();
    };
  }, []);

  return (
    <AdaptiveDialog
      title={mediaType === 'VIDEO' ? 'آپلود ویدیو جلسه' : 'آپلود صدا جلسه'}
      isOpen={isDialogOpen}
      onClose={closeDialog}
      closeOnBackdrop={!isOperationLocked}
      closeOnEscape={!isOperationLocked}
      showCloseButton={!isOperationLocked}
      bodyClassName='pt-2 sm:pt-3 md:pt-4'
      footer={
        <Button
          onClick={handleUpload}
          className='w-full text-xs sm:text-base'
          isLoading={isLoading || isCancelling}
          disable={isOperationLocked}
        >
          {isUpdate ? 'بروزرسانی' : 'ثبت جلسه'}
        </Button>
      }
    >
      <div className='min-w-0'>
        {showAccessLevel && (
          <div className='mt-2 grid grid-cols-1 gap-6 sm:mt-3'>
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

        <p className='px-1 pb-1 pt-5 text-xs leading-6 text-subtext-light xs:text-sm sm:pt-6 dark:text-subtext-dark'>
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
          className={`mt-3 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-background-light px-3 py-5 text-center sm:mt-4 sm:min-h-40 dark:bg-background-dark ${
            isOperationLocked
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
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
                ? '.mp4,.mov,.m4v,.webm,.mkv,video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska'
                : '.mp3,.m4a,.wav,.aac,.ogg,audio/*'
            }
            className='hidden'
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isOperationLocked}
          />

          <div className='min-w-0 cursor-pointer'>
            {file ? (
              <>
                <p className='break-all px-2 text-sm text-text-light dark:text-text-dark sm:px-4'>
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

        {(isLoading || currentStage === 'failed') && (
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

            {currentStage === 'uploading' && uploadMetrics && (
              <div className='mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3'>
                <div className='rounded-xl border border-black/5 bg-background-light/50 px-3 py-2.5 dark:border-white/10 dark:bg-background-dark/35'>
                  <p className='text-subtext-light dark:text-subtext-dark'>
                    حجم ارسال‌شده
                  </p>
                  <p className='mt-1 font-faNa font-semibold text-text-light dark:text-text-dark'>
                    {`${formatBytes(uploadMetrics.loadedBytes)} از ${formatBytes(
                      uploadMetrics.totalBytes
                    )}`}
                  </p>
                </div>

                <div className='rounded-xl border border-black/5 bg-background-light/50 px-3 py-2.5 dark:border-white/10 dark:bg-background-dark/35'>
                  <p className='text-subtext-light dark:text-subtext-dark'>
                    سرعت آپلود
                  </p>
                  <p className='mt-1 font-faNa font-semibold text-text-light dark:text-text-dark'>
                    {formatUploadSpeed(uploadMetrics.bytesPerSecond)}
                  </p>
                </div>

                <div className='rounded-xl border border-black/5 bg-background-light/50 px-3 py-2.5 dark:border-white/10 dark:bg-background-dark/35'>
                  <p className='text-subtext-light dark:text-subtext-dark'>
                    زمان تقریبی باقی‌مانده
                  </p>
                  <p className='mt-1 font-faNa font-semibold text-text-light dark:text-text-dark'>
                    {formatEta(uploadMetrics.etaSeconds)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p
          className={`mt-2 text-xs text-secondary sm:text-sm ${
            isLoading || activeJobId ? 'block' : 'hidden'
          }`}
        >
          {currentStage === 'failed'
            ? 'آپلود ناقص مانده است. برای آزاد شدن جلسه، دکمه توقف و لغو عملیات را بزنید.'
            : 'تا پایان آپلود اولیه این پنجره را نبندید. پس از ورود ویدئو به صف، پردازش روی سرور انجام می‌شود.'}
        </p>

        {uploadError && (
          <p className='mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'>
            {uploadError}
          </p>
        )}

        {canCancelVideoJob && (
          <button
            type='button'
            onClick={handleCancelVideoJob}
            disabled={isCancelling}
            className='mt-4 w-full rounded-lg border border-red-500 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/30'
          >
            {isCancelling
              ? 'در حال توقف عملیات...'
              : 'توقف و لغو عملیات'}
          </button>
        )}
      </div>
    </AdaptiveDialog>
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
