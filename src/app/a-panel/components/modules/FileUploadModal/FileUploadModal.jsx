/* eslint-disable no-undef */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';

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
      return currentStage === 'ready' ? 'آپلود تکمیل شد' : 'در حال آپلود فایل';
    }

    return VIDEO_STAGE_LABELS[currentStage] || 'در حال پردازش ویدئو';
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
        await onUpload(file, undefined, {
          signal: abortController.signal,

          onProgress: (value) => {
            setProgress(clampProgress(value));
          },

          onStageChange: (stage) => {
            if (typeof stage === 'string' && stage.trim()) {
              setCurrentStage(stage);
            }
          },
        });

        setCurrentStage('ready');
        setProgress(100);
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
      onClose();
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
            {title}
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

        <p className='py-4 text-sm text-subtext-light dark:text-subtext-dark'>
          {desc}
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
            accept={isVideo ? 'video/*' : 'image/*'}
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
                {isVideo
                  ? 'برای انتخاب ویدئو کلیک کنید یا فایل را اینجا رها کنید'
                  : 'برای انتخاب تصویر کلیک کنید یا فایل را اینجا رها کنید'}
              </p>
            )}
          </div>
        </div>

        {progressbar && isLoading && (
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
              {`${getStageLabel()}: ${progress}%`}
            </div>
          </div>
        )}

        {errorMessage && (
          <p className='text-red-500 mt-3 text-sm'>{errorMessage}</p>
        )}

        <p
          className={`mt-2 font-medium text-blue ${
            isLoading ? 'block' : 'hidden'
          }`}
        >
          {isVideo
            ? 'تا پایان آپلود اولیه این پنجره را نبندید. پردازش ویدئو روی سرور انجام می‌شود.'
            : 'لطفاً تا پایان فرایند آپلود از این پنجره خارج نشوید.'}
        </p>

        <Button
          onClick={handleUpload}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
          disabled={isLoading || !file}
        >
          {uploadButtonText}
        </Button>
      </div>
    </div>
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
