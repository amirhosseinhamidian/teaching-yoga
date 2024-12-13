/* eslint-disable no-undef */
'use client';
import React, { useState, useEffect } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0); // اضافه کردن state برای پیشرفت
  const [isProcessing, setIsProcessing] = useState(false); // برای بررسی پردازش
  const [isComplete, setIsComplete] = useState(false); // برای بررسی تکمیل پردازش

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setError('');
    setMessage('');
    setIsProcessing(true); // شروع پردازش
    setIsComplete(false); // پردازش کامل نشده

    const formData = new FormData();
    formData.append('video', file);
    formData.append('courseName', 'yoga-full');
    formData.append('courseId', '1');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/upload/video/courseIntro`,
        {
          method: 'POST',
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('File uploaded and converted successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error uploading file');
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
        setIsProcessing(false); // پردازش تمام شد
        setIsComplete(true); // نشان دادن اینکه پردازش کامل شده
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // استفاده از Polling برای درخواست پیشرفت هر 2 ثانیه
  useEffect(() => {
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval); // پاک‌سازی interval در هنگام ترک کامپوننت
  }, []);

  return (
    <div className='container'>
      <h1>Upload Video</h1>
      <input type='file' onChange={handleFileChange} />
      <button onClick={(e) => handleUpload(e)} disabled={isProcessing}>
        Upload
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {/* نمایش نوار پیشرفت */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#ccc',
          borderRadius: '5px',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            height: '20px',
            width: `${progress}%`,
            backgroundColor: 'green',
            borderRadius: '5px',
            textAlign: 'center',
            color: 'white',
          }}
        >
          {progress}% {/* نمایش درصد پیشرفت */}
        </div>
      </div>

      {/* نمایش پیغام تکمیل */}
      {isComplete && <p style={{ color: 'blue' }}>Upload Completed!</p>}
    </div>
  );
}
