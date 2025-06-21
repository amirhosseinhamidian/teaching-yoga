'use client';
import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AudioSlider = ({ currentTime, duration, onChange }) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSeek = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.min(
      Math.max((clientX - rect.left) / rect.width, 0),
      1,
    );
    const newTime = percent * duration;
    onChange(newTime);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleSeek(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={sliderRef}
      onMouseDown={handleMouseDown}
      className='relative h-2.5 w-full cursor-pointer rounded-full bg-foreground-light dark:bg-foreground-dark'
    >
      {/* نوار پر شده */}
      <div
        className='absolute left-0 top-0 h-2.5 rounded-full bg-accent transition-all duration-1000 ease-linear'
        style={{ width: `${percent}%` }}
      />

      {/* هندل دایره‌ای */}
      <div
        className='absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-gray-400 shadow transition-all duration-1000 ease-linear'
        style={{
          left: `calc(${percent}% - 10px)`,
        }}
      />
    </div>
  );
};

AudioSlider.propTypes = {
  currentTime: PropTypes.number,
  onChange: PropTypes.func,
  duration: PropTypes.number,
};

export default AudioSlider;
