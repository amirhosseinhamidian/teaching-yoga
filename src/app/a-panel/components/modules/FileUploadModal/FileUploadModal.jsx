/* eslint-disable no-undef */
'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import AdaptiveDialog from '@/components/Ui/AdaptiveDialog/AdaptiveDialog';
import Button from '@/components/Ui/Button/Button';

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

const FileUploadModal = ({
  title,
  desc,
  onUpload,
  onClose,
  progressbar = false,
  isVideo = false,
  uploadButtonText = 'آپلود',
}) => {
  const fileInputRef = useRef(null);
  const uploadControllerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const selectFile = (selectedFile) => {
    if (!selectedFile || isLoading) {
      return;
    }

    setFile(selectedFile);
    setProgress(0);
    setCurrentStage('idle');
    setErrorMessage('');
  };

  const handleFileChange = (event) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

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

  const getStageLabel = () => {
    if (!isVideo) {
      return currentStage === 'ready'
        ? 'آپلود تکمیل شد'
        : 'در حال آپلود فایل';
    }

    return (
      VIDEO_STAGE_LABELS[currentStage] ||
      'در حال پردازش ویدئو'
    );
  };

  const closeDialog = ({
    force = false,
  } = {}) => {
    if (
      isLoading &&
      !force
    ) {
      return;
    }

    if (closeTimerRef.current) {
      return;
    }

    setIsDialogOpen(false);

    closeTimerRef.current =
      setTimeout(() => {
        closeTimerRef.current = null;
        onClose();
      }, 240);
  };

  const handleUpload = async () => {
    if (!file || isLoading) {
      return;
    }

    const abortController = new AbortController();

    uploadControllerRef.current = abortController;

    setIsLoading(true);
    setProgress(0);
    setErrorMessage('');
    setCurrentStage(isVideo ? 'creating' : 'uploading');

    let completedSuccessfully = false;

    try {
      if (isVideo) {
        const uploadResult =
          await onUpload(
            file,
            undefined,
            {
              signal:
                abortController.signal,

              onProgress: (value) => {
                setProgress(
                  clampProgress(value)
                );
              },

              onStageChange: (stage) => {
                if (
                  typeof stage ===
                    'string' &&
                  stage.trim()
                ) {
                  setCurrentStage(
                    stage
                  );
                }
              },
            }
          );

        /*
         * GlobalVideoUploadManager مسئول status واقعی
         * ویدئو است. وقتی upload به پس‌زمینه تحویل داده
         * شد، این modal نباید READY/100% جعلی نشان دهد.
         */
        if (!uploadResult?.background) {
          setCurrentStage('ready');
          setProgress(100);
        }

        completedSuccessfully = true;
      } else {
        await onUpload(file, (value) => {
          setProgress(clampProgress(value));
        });

        setCurrentStage('ready');
        setProgress(100);
        completedSuccessfully = true;
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        setCurrentStage('cancelled');
        setErrorMessage('عملیات آپلود لغو شد.');
      } else {
        setCurrentStage('failed');

        setErrorMessage(error?.message || 'خطایی هنگام آپلود فایل رخ داد.');

        console.error('File upload error:', error);
      }
    } finally {
      uploadControllerRef.current = null;
      setIsLoading(false);
    }

    if (completedSuccessfully) {
      closeDialog({
        force: true,
      });
    }
  };

  useEffect(() => {
    return () => {
      uploadControllerRef.current?.abort();

      if (closeTimerRef.current) {
        clearTimeout(
          closeTimerRef.current
        );

        closeTimerRef.current = null;
      }
    };
  }, []);

  return (
    <AdaptiveDialog
      title={title}
      description={desc}
      isOpen={isDialogOpen}
      onClose={closeDialog}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
      panelClassName='md:max-w-[640px]'
      bodyClassName='pt-3 sm:pt-4'
      footer={
        <Button
          onClick={handleUpload}
          className='w-full text-xs sm:text-base'
          isLoading={isLoading}
          disabled={
            isLoading ||
            !file
          }
        >
          {uploadButtonText}
        </Button>
      }
    >
      <div className='min-w-0'>
        <div
          role='button'
          tabIndex={0}
          className={`flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-background-light px-3 py-5 text-center sm:min-h-40 dark:bg-background-dark ${
            isLoading
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault();
              openFilePicker();
            }
          }}
        >
          <input
            type='file'
            accept={
              isVideo
                ? 'video/*'
                : 'image/*'
            }
            className='hidden'
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isLoading}
          />

          <div className='min-w-0 cursor-pointer'>
            {file ? (
              <>
                <p className='break-all px-2 text-sm text-text-light sm:px-4 dark:text-text-dark'>
                  {file.name}
                </p>

                <p className='mt-2 font-faNa text-xs text-subtext-light dark:text-subtext-dark'>
                  {(
                    file.size /
                    1024 /
                    1024
                  ).toFixed(2)}{' '}
                  مگابایت
                </p>
              </>
            ) : (
              <p className='px-2 text-sm leading-7 text-subtext-light dark:text-subtext-dark'>
                {isVideo
                  ? 'برای انتخاب ویدئو کلیک کنید یا فایل را اینجا رها کنید'
                  : 'برای انتخاب تصویر کلیک کنید یا فایل را اینجا رها کنید'}
              </p>
            )}
          </div>
        </div>

        {isVideo && (
          <div className='mt-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 px-3 py-3 text-xs leading-6 text-blue sm:px-4 sm:text-sm'>
            بعد از شروع، آپلود و پردازش ویدئو در پس‌زمینه ادامه پیدا می‌کند و وضعیت آن از نوار آپلود سراسری قابل مشاهده است.
          </div>
        )}

        {progressbar &&
          isLoading && (
            <div className='mt-4'>
              <div className='h-3 w-full overflow-hidden rounded-full bg-foreground-light dark:bg-foreground-dark'>
                <div
                  className='h-3 rounded-full bg-primary transition-[width] duration-300'
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <div className='mt-2 text-center font-faNa text-sm text-text-light dark:text-text-dark'>
                {`${getStageLabel()}: ${progress}%`}
              </div>
            </div>
          )}

        {errorMessage && (
          <p
            role='alert'
            className='mt-4 rounded-2xl bg-red-500/10 px-3 py-3 text-sm leading-6 text-red-500'
          >
            {errorMessage}
          </p>
        )}

        {!isVideo &&
          isLoading && (
            <p className='mt-3 text-xs font-medium leading-6 text-blue sm:text-sm'>
              لطفاً تا پایان آپلود تصویر این پنجره را نبندید.
            </p>
          )}
      </div>
    </AdaptiveDialog>
  );
};

FileUploadModal.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  progressbar: PropTypes.bool,
  isVideo: PropTypes.bool,
  uploadButtonText: PropTypes.string,
};

export default FileUploadModal;
