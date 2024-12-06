import React from 'react';
import PropTypes from 'prop-types';
import { IoClose } from 'react-icons/io5';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';

const VideoModal = ({ onClose, videoKey }) => {
  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div className='relative w-2/3 rounded-xl bg-surface-light p-6 dark:bg-background-dark'>
        <div className='flex items-center justify-between border-b border-subtext-light pb-3 dark:border-subtext-dark'>
          <h3 className='text-lg font-semibold text-text-light dark:text-text-dark'>
            مشاهده ویدیو
          </h3>
          <button onClick={onClose}>
            <IoClose
              size={24}
              className='text-subtext-light md:cursor-pointer dark:text-subtext-dark'
            />
          </button>
        </div>
        <div className='mt-4'>
          <VideoPlayer videoUrl={videoKey} isAdmin={true} />
        </div>
      </div>
    </div>
  );
};

VideoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  videoKey: PropTypes.string.isRequired,
};

export default VideoModal;
