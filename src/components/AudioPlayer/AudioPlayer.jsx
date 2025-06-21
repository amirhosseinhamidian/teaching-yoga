'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { IoPlay, IoPauseOutline } from 'react-icons/io5';
import { MdForward10, MdOutlineReplay10 } from 'react-icons/md';
import AudioSlider from '../Ui/AudioSlider/AudioSlider';

const formatTime = (sec) => {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const AudioPlayer = ({ src, duration, coverUrl, sessionId, userId }) => {
  const soundRef = useRef(null);
  const intervalRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const markedCompleteRef = useRef(false);

  useEffect(() => {
    const fetchAndLoad = async () => {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);

        soundRef.current = new Howl({
          src: [objectUrl],
          html5: true,
          preload: 'auto',
          onend: () => {
            setIsPlaying(false);
            clearInterval(intervalRef.current);
          },
        });

        fetchAudioCompletionStatus();
      } catch (error) {
        console.error('Error loading audio blob:', error);
      }
    };

    fetchAndLoad();

    return () => {
      soundRef.current?.unload();
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
        const current = soundRef.current.seek();
        setCurrentTime(current);

        if (
          !markedCompleteRef.current &&
          duration &&
          current / duration >= 0.8
        ) {
          markAudioAsCompleted();
          markedCompleteRef.current = true;
        }
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
    <div className='mx-auto rounded-xl bg-surface-light p-4 dark:bg-surface-dark'>
      <Image
        src={coverUrl}
        width={800}
        height={600}
        alt='course cover'
        className='mx-auto mb-4 w-full max-w-md rounded-lg object-cover'
      />
      <div className='mt-8 xs:px-2 md:px-10'>
        <div className='flex w-full items-center gap-3'>
          <span className='w-9 text-left font-faNa text-sm text-subtext-light md:w-12 md:text-base dark:text-subtext-dark'>
            {formatTime(duration)}
          </span>
          <div className='flex-1'>
            <AudioSlider
              currentTime={currentTime}
              duration={duration}
              onChange={(newTime) => {
                if (soundRef.current) {
                  soundRef.current.seek(newTime);
                }
                setCurrentTime(newTime);
              }}
            />
          </div>
          <span className='w-9 text-right font-faNa text-sm text-subtext-light md:w-12 md:text-base dark:text-subtext-dark'>
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      <div className='my-3 flex items-baseline justify-center gap-3 xs:my-4 xs:gap-4 sm:my-6 sm:gap-6'>
        <button
          onClick={() => seek(10)}
          className='relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-accent shadow-md transition-all duration-200 active:scale-95 xs:h-9 xs:w-9 sm:h-11 sm:w-11 dark:bg-gray-800'
        >
          <div className='absolute inset-0 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] shadow-accent/50'></div>
          <MdForward10 className='text-lg xs:text-xl sm:text-2xl' />
        </button>
        <button
          onClick={togglePlay}
          className='relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-accent shadow-lg transition-all duration-200 active:scale-95 xs:h-14 xs:w-14 sm:h-20 sm:w-20 dark:bg-gray-800'
        >
          <div className='absolute inset-0 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)] shadow-accent/60'></div>

          <span className='transition-opacity duration-200 ease-in-out'>
            {isPlaying ? (
              <IoPauseOutline className='text-3xl xs:text-4xl sm:text-5xl' />
            ) : (
              <IoPlay className='pl-1 text-3xl xs:text-4xl sm:text-5xl' />
            )}
          </span>
        </button>
        <button
          onClick={() => seek(-10)}
          className='relative flex h-8 w-8 items-center justify-center rounded-full bg-white text-accent shadow-md transition-all duration-200 active:scale-95 xs:h-9 xs:w-9 sm:h-11 sm:w-11 dark:bg-gray-800'
        >
          <div className='absolute inset-0 rounded-full shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] shadow-accent/50'></div>
          <MdOutlineReplay10 className='text-lg xs:text-xl sm:text-2xl' />
        </button>
      </div>
    </div>
  );
};

AudioPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  coverUrl: PropTypes.string,
  sessionId: PropTypes.string,
  userId: PropTypes.string,
  duration: PropTypes.number,
};

export default AudioPlayer;
