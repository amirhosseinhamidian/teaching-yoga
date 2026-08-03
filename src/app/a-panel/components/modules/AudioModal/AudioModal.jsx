'use client';

import React, { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { IoClose } from 'react-icons/io5';

import { ImSpinner2 } from 'react-icons/im';

const AudioModal = ({ onClose, sessionId }) => {
  const [mediaUrl, setMediaUrl] = useState('');

  const [error, setError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadPreview = async () => {
      setIsLoading(true);
      setError('');
      setMediaUrl('');

      try {
        const response = await fetch(
          `/api/lesson?sessionId=${encodeURIComponent(sessionId)}`,
          {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
            signal: controller.signal,
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result?.error || 'دریافت فایل صوتی جلسه ناموفق بود.');
        }

        if (result?.mediaType !== 'AUDIO' || !result?.mediaLink) {
          throw new Error('برای این جلسه فایل صوتی معتبری ثبت نشده است.');
        }

        setMediaUrl(result.mediaLink);
      } catch (loadError) {
        if (loadError?.name === 'AbortError') {
          return;
        }

        console.error('[admin-audio-preview]', loadError);

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'خطا در دریافت فایل صوتی.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='hide-scrollbar relative max-h-screen w-11/12 overflow-y-auto rounded-xl bg-surface-light p-6 md:w-2/3 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            فایل صوتی جلسه
          </h3>

          <button type='button' onClick={onClose} aria-label='بستن'>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>

        <div className='mt-6'>
          {isLoading ? (
            <div className='flex min-h-32 items-center justify-center'>
              <ImSpinner2 size={34} className='animate-spin text-primary' />
            </div>
          ) : error ? (
            <div className='bg-red-50 text-red-600 rounded-xl p-5 text-center text-sm'>
              {error}
            </div>
          ) : (
            <audio
              key={mediaUrl}
              src={mediaUrl}
              controls
              preload='metadata'
              className='w-full rounded-full border border-accent'
            >
              مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
            </audio>
          )}
        </div>
      </div>
    </div>
  );
};

AudioModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  sessionId: PropTypes.string.isRequired,
};

export default AudioModal;
