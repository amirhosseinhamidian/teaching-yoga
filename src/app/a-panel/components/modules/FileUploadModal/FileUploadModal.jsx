/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import Button from '@/components/Ui/Button/Button';
import { processVideo } from '@/services/videoProcessor';

const FileUploadModal = ({
  title,
  desc,
  onUpload,
  onClose,
  progressbar = false,
  isVideo = false,
  uploadButtonText = 'آپلود',
}) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  1;
  const [currentStage, setCurrentStage] = useState('processing'); // وضعیت مرحله‌ای
  const [isComplete, setIsComplete] = useState(false);
  const fileInputRef = useRef(null);
  const pollingRef = useRef(null);
  const controller = new AbortController();

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

  const fetchProgress = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/progress`,
      );
      const data = await response.json();
      setProgress(data.progress);
    } catch (error) {
      console.error('Error fetching upload progress:', error);
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

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setCurrentStage('processing'); // شروع پردازش ویدیو

    try {
      if (isVideo) {
        // پردازش ویدیو
        const outFiles = await processVideo(file, true, (progress) => {
          setProgress(progress);
        });
        if (!outFiles || outFiles.length === 0) {
          throw new Error('No output files generated.');
        }
        setCurrentStage('uploading'); // تغییر به مرحله آپلود
        setProgress(0); // ریست پروگرس بار
        startPolling(); // شروع پولینگ برای آپلود
        await onUpload(outFiles); // ارسال فایل برای آپلود
      } else {
        await onUpload(file, setProgress);
      }
    } finally {
      if (!isVideo) {
        setIsLoading(false);
        setProgress(100); // اتمام آپلود
        setIsComplete(true);
      }
    }
  };

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
        <p className='py-4 text-sm text-subtext-light dark:text-subtext-dark'>
          {desc}
        </p>
        <div
          className='mt-4 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-accent bg-background-light text-center dark:bg-background-dark'
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
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
        {progressbar && isLoading && (
          <div>
            <div className='mt-4 h-3 w-full rounded-full bg-foreground-light dark:bg-foreground-dark'>
              <div
                className='h-3 rounded-full bg-primary'
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className='mt-2 text-center font-faNa text-sm'>
              {currentStage === 'processing'
                ? `پردازش ویدیو: ${progress}%`
                : `آپلود ویدیو: ${progress}%`}
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
          className='mt-8 text-xs sm:text-base'
          isLoading={isLoading}
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
