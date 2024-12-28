/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Ui/Button/Button';
import { IoClose } from 'react-icons/io5';
import { createToastHandler } from '@/utils/toastHandler';
import { useTheme } from '@/contexts/ThemeContext';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import DropDown from '@/components/Ui/DropDown/DropDwon';
import { PUBLIC, PURCHASED, REGISTERED } from '@/constants/videoAccessLevel';
import { processVideo } from '@/services/videoProcessor';

const UploadSessionVideoModal = ({ onClose, onUpload }) => {
  const { isDark } = useTheme();
  const toast = createToastHandler(isDark);

  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null); // state برای پیشرفت
  const fileInputRef = useRef(null);
  const [isComplete, setIsComplete] = useState(false);
  const [videoDirection, setVideoDirection] = useState('HORIZONTAL');
  const [accessLevel, setAccessLevel] = useState('');
  const [stepUpload, setStepUpload] = useState(false);
  const [lastValidProgress, setLastValidProgress] = useState(0);
  const [errorMessages, setErrorMessages] = useState({
    accessLevel: '',
  });

  const accessVideoOptions = [
    { label: 'عمومی', value: PUBLIC },
    { label: 'ثبت نام', value: REGISTERED },
    { label: 'خریداری', value: PURCHASED },
  ];

  const videoDirectionOptions = [
    { label: 'افقی', value: 'HORIZONTAL' },
    { label: 'عمودی', value: 'VERTICAL' },
  ];

  const validateInputs = () => {
    let errors = {};

    if (!accessLevel) {
      errors.accessLevel = 'سطح دسترسی ویدیو را مشخص کنید.';
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

  const handleUpload = async () => {
    if (!validateInputs()) {
      toast.showErrorToast('مقادیر را به درستی وارد کنید');
      return;
    }

    if (!file) {
      toast.showErrorToast('لطفاً یک فایل انتخاب کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const outFiles = await processVideo(
        file,
        videoDirection === 'VERTICAL',
        (progress) => {
          setProgress(progress);
          if (progress === 100 && !stepUpload) {
            setStepUpload(true);
          }
        },
      );

      if (!outFiles || outFiles.length === 0) {
        throw new Error('No output files generated.');
      }

      await onUpload(outFiles, videoDirection === 'VERTICAL');
    } catch (error) {
      console.error('Upload error:', error);
      toast.showErrorToast('خطایی در آپلود فایل رخ داده است.');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
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

      if (data.progress >= 100) {
        setIsComplete(true); // نشان دادن اینکه پردازش کامل شده
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // استفاده از Polling برای درخواست پیشرفت هر 5 ثانیه
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isComplete) {
        fetchProgress();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isComplete]);

  useEffect(() => {
    if (stepUpload) {
      setLastValidProgress(progress);
    } else {
      if (progress > 0) {
        setLastValidProgress(progress);
      }
    }
  }, [progress]);
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            آپلود ویدیو جلسه
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
            options={accessVideoOptions}
            placeholder='سطح دسترسی ویدیو را مشخص کنید'
            value={accessLevel}
            onChange={setAccessLevel}
            errorMessage={errorMessages.accessLevel}
            label='سطح دسترسی'
            className='bg-surface-ligh text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
          <DropDown
            options={videoDirectionOptions}
            placeholder='جهت ویدیو را مشخص کنید'
            value={videoDirection}
            onChange={setVideoDirection}
            label='جهت ویدیو'
            className='bg-surface-light text-text-light placeholder:text-xs placeholder:sm:text-sm dark:bg-surface-dark dark:text-text-dark'
          />
        </div>

        {/* Description */}
        <p className='px-2 pb-1 pt-6 text-xs text-subtext-light xs:text-sm dark:text-subtext-dark'>
          برای آپلود ویدیو جلسه فایل خود را در اینجا بکشید و رها کنید یا با کلیک
          انتخاب کنید.
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
            accept='image/*,video/*'
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
                Click to upload or drag and drop your file here
              </p>
            )}
          </label>
        </div>
        {/* Progress Bar */}
        <div className={`${isLoading ? 'block' : 'hidden'}`}>
          <div
            className={`mt-4 h-3 w-full rounded-full bg-foreground-light dark:bg-foreground-dark`}
          >
            <div
              className='h-3 rounded-full bg-primary'
              style={{ width: `${lastValidProgress}%` }}
            ></div>
          </div>
          <div className={`mt-2 text-center font-faNa text-sm`}>
            {lastValidProgress}% {/* نمایش درصد پیشرفت */}
          </div>
        </div>
        {stepUpload ? (
          <p className={`mt-2 text-blue ${isLoading ? 'block' : 'hidden'}`}>
            در حال آپلود ویدیو ...
          </p>
        ) : (
          <p
            className={`mt-2 font-faNa text-blue ${isLoading ? 'block' : 'hidden'}`}
          >
            در حال پردازش اولیه ...
          </p>
        )}
        <p className={`mt-2 text-blue ${isLoading ? 'block' : 'hidden'}`}>
          لطفا تا پایان فرایند آپلود از این باکس خارج نشوید!
        </p>

        <Button
          onClick={handleUpload}
          className='mt-8 flex items-center justify-center text-xs sm:text-base'
          disable={isLoading}
        >
          ثبت جلسه
          {isLoading && (
            <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
          )}
        </Button>
      </div>
    </div>
  );
};

UploadSessionVideoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
};

export default UploadSessionVideoModal;
