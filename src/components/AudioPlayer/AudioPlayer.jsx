'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Howl } from 'howler';

import PropTypes from 'prop-types';
import Image from 'next/image';

import { IoPauseOutline, IoPlay } from 'react-icons/io5';

import { MdForward10, MdOutlineReplay10 } from 'react-icons/md';

import {
  HiOutlineCheckBadge,
  HiOutlineMusicalNote,
  HiOutlineSparkles,
} from 'react-icons/hi2';

import AudioSlider from '../Ui/AudioSlider/AudioSlider';

import SiteCard from '@/components/SiteUi/Card/SiteCard';
import SiteBadge from '@/components/SiteUi/Badge/SiteBadge';

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const formatTime = (sec) => {
  const safeSec = Number(sec) || 0;

  const minutes = Math.floor(safeSec / 60);

  const seconds = Math.floor(safeSec % 60);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const AudioPlayer = ({ src, duration, coverUrl, sessionId }) => {
  const soundRef = useRef(null);
  const intervalRef = useRef(null);

  const markedCompleteRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);

  const [isReady, setIsReady] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);

  const [isCompleted, setIsCompleted] = useState(false);

  /*
   * توقف Interval مربوط به Progress
   */
  const stopProgressTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);

      intervalRef.current = null;
    }
  };

  /*
   * وضعیت تکمیل جلسه صوتی
   */
  const fetchAudioCompletionStatus = async () => {
    if (!sessionId) {
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(
        `${apiBaseUrl}/api/session-progress/${encodeURIComponent(
          sessionId
        )}/complete`,
        {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json().catch(() => null);

      if (typeof data?.isCompleted === 'boolean') {
        setIsCompleted(data.isCompleted);

        markedCompleteRef.current = data.isCompleted;
      }
    } catch (error) {
      console.error('[AUDIO_COMPLETION_STATUS_ERROR]', error);
    }
  };

  /*
   * ثبت تکمیل جلسه
   */
  const markAudioAsCompleted = async () => {
    if (!sessionId || markedCompleteRef.current) {
      return;
    }

    /*
     * جلوی چند Request همزمان
     */
    markedCompleteRef.current = true;

    try {
      const apiBaseUrl = getApiBaseUrl();

      const response = await fetch(
        `${apiBaseUrl}/api/session-progress/${encodeURIComponent(
          sessionId
        )}/complete`,
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            completed: true,
          }),
        }
      );

      if (!response.ok) {
        markedCompleteRef.current = false;

        return;
      }

      setIsCompleted(true);
    } catch (error) {
      markedCompleteRef.current = false;

      console.error('[AUDIO_MARK_COMPLETE_ERROR]', error);
    }
  };

  /*
   * شروع Timer مربوط به Progress
   */
  const startProgressTimer = (sound) => {
    stopProgressTimer();

    intervalRef.current = window.setInterval(() => {
      if (!sound) {
        return;
      }

      const seekValue = sound.seek();

      const current = typeof seekValue === 'number' ? seekValue : 0;

      setCurrentTime(current);

      /*
       * اول duration دیتابیس.
       * در صورت نبود، duration واقعی Howler.
       */
      const actualDuration =
        Number(duration) > 0 ? Number(duration) : Number(sound.duration());

      if (
        !markedCompleteRef.current &&
        Number.isFinite(actualDuration) &&
        actualDuration > 0 &&
        current >= actualDuration * 0.8
      ) {
        markAudioAsCompleted();
      }
    }, 500);
  };

  /*
   * ساخت Audio Player
   *
   * مهم:
   * دیگر fetch -> blob نداریم.
   *
   * Howler مستقیماً Protected URL را
   * با HTML5 Audio پخش می‌کند.
   */
  useEffect(() => {
    if (!src) {
      return undefined;
    }

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);

    stopProgressTimer();

    /*
     * Howler بلافاصله ساخته می‌شود.
     *
     * بنابراین کلیک اول دیگر به
     * soundRef.current === null
     * برخورد نمی‌کند.
     */
    const sound = new Howl({
      src: [src],

      /*
       * چون Protected URL پسوند فایل ندارد،
       * Howler نمی‌تواند codec را از URL تشخیص دهد.
       */
      format: ['mp3'],

      /*
       * برای فایل‌های بزرگ از HTML5 Audio استفاده می‌کنیم
       * تا کل فایل وارد حافظه نشود.
       */
      html5: true,

      /*
       * فقط Metadata برای آماده شدن Player لود شود.
       * لازم نیست کل فایل 14MB دانلود شود.
       */
      preload: 'metadata',

      onload: () => {
        setIsReady(true);
      },

      onplay: () => {
        /*
         * Safety fallback:
         * اگر مرورگر onload را دیرتر اعلام کرد،
         * با شروع موفق پخش Player قطعاً آماده است.
         */
        setIsReady(true);
        setIsPlaying(true);

        startProgressTimer(sound);
      },

      onpause: () => {
        setIsPlaying(false);

        stopProgressTimer();

        const seekValue = sound.seek();

        if (typeof seekValue === 'number') {
          setCurrentTime(seekValue);
        }
      },

      onstop: () => {
        setIsPlaying(false);

        stopProgressTimer();
      },

      onend: () => {
        setIsReady(true);
        setIsPlaying(false);

        stopProgressTimer();

        const actualDuration =
          Number(duration) > 0 ? Number(duration) : Number(sound.duration());

        if (Number.isFinite(actualDuration)) {
          setCurrentTime(actualDuration);
        }

        if (!markedCompleteRef.current) {
          markAudioAsCompleted();
        }
      },

      onloaderror: (_soundId, error) => {
        setIsReady(false);
        setIsPlaying(false);

        stopProgressTimer();

        console.error('[AUDIO_LOAD_ERROR]', error);
      },

      onplayerror: (_soundId, error) => {
        setIsPlaying(false);

        console.error('[AUDIO_PLAY_ERROR]', error);

        sound.once('unlock', () => {
          sound.play();
        });
      },
    });

    soundRef.current = sound;

    if (sound.state() === 'unloaded') {
      sound.load();
    }

    /*
     * وضعیت تکمیل را مستقل می‌گیریم.
     */
    fetchAudioCompletionStatus();

    return () => {
      stopProgressTimer();

      sound.unload();

      if (soundRef.current === sound) {
        soundRef.current = null;
      }
    };
  }, [src, sessionId]);

  /*
   * Play / Pause
   */
  const togglePlay = () => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    if (sound.playing()) {
      sound.pause();

      return;
    }

    /*
     * اگر Audio هنوز کامل Load نشده باشد
     * Howler این Play را Queue می‌کند.
     *
     * بنابراین همان کلیک اول کافی است.
     */
    sound.play();
  };

  /*
   * Seek ±10
   */
  const seek = (offset) => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    const seekValue = sound.seek();

    const current = typeof seekValue === 'number' ? seekValue : 0;

    const actualDuration =
      Number(duration) > 0 ? Number(duration) : Number(sound.duration());

    if (!Number.isFinite(actualDuration) || actualDuration <= 0) {
      return;
    }

    const newTime = Math.min(Math.max(current + offset, 0), actualDuration);

    sound.seek(newTime);

    setCurrentTime(newTime);
  };

  /*
   * تغییر Slider
   */
  const handleSliderChange = (newTime) => {
    const sound = soundRef.current;

    if (sound) {
      sound.seek(newTime);
    }

    setCurrentTime(newTime);
  };

  return (
    <SiteCard
      as='section'
      variant='glass'
      padding='none'
      radius='lg'
      topLine
      className='p-4 sm:p-5'
    >
      <div
        aria-hidden='true'
        className='absolute -right-28 -top-28 h-72 w-72 rounded-full bg-secondary/10 blur-[100px]'
      />

      <div className='relative z-10'>
        {/* Cover */}
        <div className='relative mx-auto max-w-2xl overflow-hidden rounded-[24px] bg-black'>
          {coverUrl && (
            <Image
              src={coverUrl}
              width={1200}
              height={675}
              alt='course cover'
              className='aspect-video w-full object-cover'
            />
          )}

          <div className='absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent' />

          <div className='absolute right-4 top-4'>
            <SiteBadge
              icon={HiOutlineMusicalNote}
              variant='neutral'
              size='sm'
              className='border-white/15 bg-black/30 text-white backdrop-blur-md dark:border-white/15 dark:bg-black/30 dark:text-white'
            >
              جلسه صوتی
            </SiteBadge>
          </div>

          {isCompleted && (
            <div className='absolute bottom-4 right-4'>
              <SiteBadge
                icon={HiOutlineCheckBadge}
                variant='success'
                size='sm'
                className='border-white/15 bg-black/35 text-white backdrop-blur-md'
              >
                تکمیل‌شده
              </SiteBadge>
            </div>
          )}

          <span className='absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white backdrop-blur-md'>
            <HiOutlineSparkles size={18} />
          </span>
        </div>

        {/* Timeline */}
        <div className='mx-auto mt-6 max-w-3xl sm:px-3'>
          <div className='flex w-full items-center gap-3'>
            <span className='w-11 shrink-0 text-left font-faNa text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
              {formatTime(duration)}
            </span>

            <div className='min-w-0 flex-1'>
              <AudioSlider
                currentTime={currentTime}
                duration={duration}
                onChange={handleSliderChange}
              />
            </div>

            <span className='w-11 shrink-0 text-right font-faNa text-[10px] text-subtext-light sm:text-xs dark:text-subtext-dark'>
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Loading */}
        {!isReady && (
          <div className='mt-3 flex items-center justify-center gap-2 text-[10px] font-bold text-subtext-light sm:text-xs dark:text-subtext-dark'>
            <span className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-secondary/20 border-t-secondary' />

            <span>در حال آماده‌سازی فایل صوتی...</span>
          </div>
        )}

        {/* Controls */}
        <div className='mt-5 flex items-center justify-center gap-4 sm:gap-6'>
          <button
            type='button'
            onClick={() => seek(10)}
            aria-label='۱۰ ثانیه جلو'
            title='۱۰ ثانیه جلو'
            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/5 p-0 text-secondary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white active:scale-95 dark:bg-secondary/10'
          >
            <MdForward10 size={22} />
          </button>

          <button
            type='button'
            onClick={togglePlay}
            aria-label={isPlaying ? 'توقف پخش' : 'پخش فایل صوتی'}
            title={isPlaying ? 'توقف' : 'پخش'}
            className='relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-secondary/20 bg-secondary text-white shadow-[0_15px_40px_rgba(38,145,125,0.28)] transition-all duration-200 hover:scale-[1.04] active:scale-95 sm:h-[72px] sm:w-[72px]'
          >
            <span className='absolute inset-1 rounded-full border border-white/15' />

            {isPlaying ? (
              <IoPauseOutline size={34} className='relative' />
            ) : (
              <IoPlay size={34} className='relative translate-x-[2px]' />
            )}
          </button>

          <button
            type='button'
            onClick={() => seek(-10)}
            aria-label='۱۰ ثانیه عقب'
            title='۱۰ ثانیه عقب'
            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/5 p-0 text-secondary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-white active:scale-95 dark:bg-secondary/10'
          >
            <MdOutlineReplay10 size={22} />
          </button>
        </div>
      </div>
    </SiteCard>
  );
};

AudioPlayer.propTypes = {
  src: PropTypes.string.isRequired,

  coverUrl: PropTypes.string,

  sessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  duration: PropTypes.number,
};

export default AudioPlayer;
