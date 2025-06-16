'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import PropTypes from 'prop-types';

const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const AudioPlayer = ({ src, coverUrl, sessionId, userId }) => {
  const soundRef = useRef(null);
  const intervalRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    soundRef.current = new Howl({
      src: [src],
      html5: true,
      onload: () => {
        setDuration(soundRef.current.duration());
      },
      onend: async () => {
        await markAudioAsCompleted();
        setIsPlaying(false);
        clearInterval(intervalRef.current);
      },
    });

    fetchAudioCompletionStatus();

    return () => {
      soundRef.current.unload();
      clearInterval(intervalRef.current);
    };
  }, [src]);

  const togglePlay = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
      clearInterval(intervalRef.current);
    } else {
      soundRef.current.play();
      intervalRef.current = setInterval(() => {
        setCurrentTime(soundRef.current.seek());
      }, 500);
    }

    setIsPlaying(!isPlaying);
  };

  const seek = (offset) => {
    if (!soundRef.current) return;

    const newTime = Math.min(
      Math.max(soundRef.current.seek() + offset, 0),
      duration,
    );
    soundRef.current.seek(newTime);
    setCurrentTime(newTime);
  };

  const markAudioAsCompleted = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-progress/${sessionId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            userId: userId,
          },
          body: JSON.stringify({ completed: true }),
        },
      );
      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking audio as completed:', error);
    }
  };

  const fetchAudioCompletionStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-progress/${sessionId}/complete`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            userId: userId,
          },
        },
      );
      const data = await response.json();
      if (data.isCompleted !== undefined) {
        setIsCompleted(data.isCompleted);
      }
    } catch (error) {
      console.error('Error fetching audio completion status:', error);
    }
  };

  return (
    <div className='mx-auto max-w-md rounded-xl bg-white p-4 shadow dark:bg-zinc-900'>
      <img
        src={coverUrl}
        alt='cover'
        className='mb-4 h-48 w-full rounded-lg object-cover'
      />
      <div className='mb-3 flex items-center justify-between'>
        <button
          onClick={() => seek(-10)}
          className='text-lg font-bold text-gray-600 dark:text-gray-300'
        >
          ⏪ 10s
        </button>
        <button
          onClick={togglePlay}
          className='text-2xl font-bold text-primary'
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button
          onClick={() => seek(10)}
          className='text-lg font-bold text-gray-600 dark:text-gray-300'
        >
          10s ⏩
        </button>
      </div>
      <div className='text-center text-sm text-gray-500 dark:text-gray-400'>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      {isCompleted && (
        <div className='text-green-600 mt-2 text-center text-xs'>
          ✅ این جلسه کامل گوش داده شده است
        </div>
      )}
    </div>
  );
};

AudioPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  coverUrl: PropTypes.string,
  sessionId: PropTypes.string,
  userId: PropTypes.string,
};

export default AudioPlayer;
