/* eslint-disable no-undef */
'use client';
import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import Button from '@/components/Ui/Button/Button';

const FileUploadModal = ({
  title,
  desc,
  onUpload,
  onClose,
  progressbar = false,
  uploadButtonText = 'آپلود',
}) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // state برای پیشرفت
  const fileInputRef = useRef(null);
  const [isComplete, setIsComplete] = useState(false);

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
    if (!file) return;

    setIsLoading(true);
    try {
      await onUpload(file, setProgress); // ارسال تابع برای آپدیت پیشرفت
    } finally {
      setIsLoading(false);
      setProgress(100);
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
    if (progressbar) {
      const interval = setInterval(() => {
        if (!isComplete) {
          fetchProgress();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isComplete]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            {title}
          </h3>
          <button onClick={onClose} disabled={isLoading}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        {/* Description */}
        <p className='py-4 text-sm text-subtext-light dark:text-subtext-dark'>
          {desc}
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
        {progressbar && (
          <div className={`${isLoading ? 'block' : 'hidden'}`}>
            <div
              className={`mt-4 h-3 w-full rounded-full bg-foreground-light dark:bg-foreground-dark`}
            >
              <div
                className='h-3 rounded-full bg-primary'
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={`mt-2 text-center font-faNa text-sm`}>
              {progress}% {/* نمایش درصد پیشرفت */}
            </div>
          </div>
        )}
        <p
          className={`mt-2 font-medium text-blue ${isLoading ? 'block' : 'hidden'}`}
        >
          لطفا تا پایان فرایند آپلود از این باکس خارج نشوید!
        </p>
        <Button
          onClick={handleUpload}
          className='mt-8 flex items-center justify-center text-xs sm:text-base'
          disable={isLoading}
        >
          {uploadButtonText}
          {isLoading && (
            <AiOutlineLoading3Quarters className='mr-2 animate-spin' />
          )}
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
  uploadButtonText: PropTypes.string,
};

export default FileUploadModal;
