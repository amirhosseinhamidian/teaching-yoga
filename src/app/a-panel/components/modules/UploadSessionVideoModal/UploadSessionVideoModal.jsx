/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { PUBLIC, PURCHASED, REGISTERED } from '@/constants/videoAccessLevel';
import { processVideo } from '@/services/videoProcessor';

const UploadSessionMediaModal = ({
  onClose,
  onUpload,
  mediaAccessLevel,
  mediaType, // 'VIDEO' یا 'AUDIO'
  isUpdate = false,
}) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);
  const controller = new AbortController();

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // state برای پیشرفت
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const [isComplete, setIsComplete] = useState(false);
  const [accessLevel, setAccessLevel] = useState(mediaAccessLevel || '');
  const [currentStage, setCurrentStage] = useState('processing');
  const [errorMessages, setErrorMessages] = useState({
    accessLevel: '',
  });

  const accessMediaOptions = [
    { label: 'عمومی', value: PUBLIC },
    { label: 'ثبت نام', value: REGISTERED },
    { label: 'خریداری', value: PURCHASED },
  ];

  // برای ویدیو
  const videoDirectionOptions = [
    { label: 'افقی', value: 'HORIZONTAL' },
    { label: 'عمودی', value: 'VERTICAL' },
  ];

  const validateInputs = () => {
    let errors = {};

    if (!accessLevel) {
      errors.accessLevel = 'سطح دسترسی را مشخص کنید.';
    }

    setErrorMessages(errors);

    // Return true if no errors exist
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // تابعی برای دریافت درصد پیشرفت از API
  const fetchProgress = async () => {
    if (isComplete) return; // جلوگیری از درخواست اضافی بعد از تکمیل

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/progress`,
      );
      const data = await response.json();

      setProgress(data.progress); // به‌روزرسانی درصد پیشرفت
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleUpload = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }

    if (!file) {
      toast.showErrorToast('لطفاً یک فایل انتخاب کنید.');
      return;
    }
    setCurrentStage('processing');
    setIsLoading(true);
    try {
      let outFiles;
      // اگر رسانه ویدیو باشد
      if (mediaType === 'VIDEO') {
        outFiles = await processVideo(
          file,
          videoDirection === 'HORIZONTAL',
          (progress) => {
            setProgress(progress);
          },
        );
      } else if (mediaType === 'AUDIO') {
        // برای فایل صوتی هیچ پردازش خاصی نیاز نیست
        outFiles = [file];
      }
      if (!outFiles || outFiles.length === 0) {
        throw new Error('No output files generated.');
      }

      setCurrentStage('uploading');
      setProgress(0);
      startPolling();

      await onUpload(outFiles, mediaType === 'VIDEO', accessLevel);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Upload canceled.');
      } else {
        console.error('Upload error:', error);
        toast.showErrorToast('خطایی در آپلود فایل رخ داده است.');
      }
    } finally {
      setIsLoading(false);
      setProgress(100);
      setIsComplete(true);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      if (!isComplete) {
        fetchProgress();
      } else {
        clearInterval(pollingRef.current);
        pollingRef.current = null; // ریست پولینگ
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
      controller.abort();
    };
  }, []);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative max-h-screen w-2/3 overflow-y-auto rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            {mediaType === 'VIDEO' ? 'آپلود ویدیو جلسه' : 'آپلود صدا جلسه'}
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>

        <div className='mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2'>
          <DropDown
            options={accessMediaOptions}
            placeholder='سطح دسترسی را مشخص کنید'
            value={accessLevel}
            onChange={setAccessLevel}
            errorMessage={errorMessages.accessLevel}
            label='سطح دسترسی'
            fullWidth
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          {mediaType === 'VIDEO' && (
            <DropDown
              options={videoDirectionOptions}
              placeholder='جهت ویدیو را مشخص کنید'
              value={videoDirection}
              onChange={setVideoDirection}
              label='جهت ویدیو'
              fullWidth
              className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
            />
          )}
        </div>

        {/* Description */}
        <p className='px-2 pb-1 pt-6 text-xs text-subtext-light xs:text-sm dark:text-subtext-dark'>
          {isUpdate
            ? `برای آپدیت ${mediaType === 'VIDEO' ? 'ویدیو' : 'صدا'} جلسه ، فایل خود را در اینجا بکشید و رها کنید یا با کلیک انتخاب کنید. فایل قبلی به صورت خودکار پاک خواهد شد.`
            : `برای آپلود ${mediaType === 'VIDEO' ? 'ویدیو' : 'صدا'} جلسه فایل خود را در اینجا بکشید و رها کنید یا با کلیک انتخاب کنید.`}
        </p>

        {/* Upload Area */}
        <div
          className='mt-4 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-accent bg-background-light text-center dark:bg-background-dark'
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFilePicker}
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
          />
          <label className='cursor-pointer'>
            {file ? (
              <p className='text-sm text-text-light dark:text-text-dark'>
                {file.name}
              </p>
            ) : (
              <p className='text-sm text-subtext-light dark:text-subtext-dark'>
                {mediaType === 'VIDEO'
                  ? 'Click to upload video'
                  : 'Click to upload audio'}
              </p>
            )}
          </label>
        </div>
        {isLoading && (
          <>
            {mediaType === 'VIDEO' && (
              <div>
                <div className='mt-4 h-3 w-full rounded-full bg-foreground-light dark:bg-foreground-dark'>
                  <div
                    className='h-3 rounded-full bg-primary'
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className='mt-2 text-center font-faNa text-sm'>
                  {currentStage === 'processing'
                    ? `${mediaType === 'VIDEO' ? 'پردازش ویدیو' : 'پردازش صدا'}: ${progress}%`
                    : `${mediaType === 'VIDEO' ? 'آپلود ویدیو' : 'آپلود صدا'}: ${progress}%`}
                </div>
              </div>
            )}
          </>
        )}
        <p
          className={`mt-2 text-xs text-secondary sm:text-sm ${isLoading ? 'block' : 'hidden'}`}
        >
          لطفا تا پایان فرایند آپلود از این باکس خارج نشوید!
        </p>

        <Button
          onClick={handleUpload}
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
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
  mediaType: PropTypes.oneOf(['VIDEO', 'AUDIO']).isRequired, // نوع رسانه را مشخص می‌کند
  isUpdate: PropTypes.bool,
};

export default UploadSessionMediaModal;
