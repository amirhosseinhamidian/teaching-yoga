import React from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';

const AudioModal = ({ onClose, audioKey }) => {
  const finalUrl = `/api/audio-proxy?url=${encodeURIComponent(audioKey)}&_=${Date.now()}`;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div className='hide-scrollbar relative max-h-screen w-2/3 overflow-y-auto rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            فایل صوتی جلسه
          </h3>
          <button onClick={onClose}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>

        <div className='mt-4'>
          <audio
            key={audioKey} // 🔑 این باعث میشه که element به طور کامل ری‌بساز شه
            controls
            className='mt-4 w-full rounded-full border border-accent'
          >
            <source src={finalUrl} type='audio/mpeg' />
            مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
          </audio>
        </div>
      </div>
    </div>
  );
};

AudioModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  audioKey: PropTypes.string.isRequired,
};

export default AudioModal;
