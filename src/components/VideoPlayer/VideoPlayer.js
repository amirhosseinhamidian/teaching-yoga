/* eslint-disable react/no-unknown-property */
/* eslint-disable no-undef */

'use client';

import React, { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';

import 'plyr/dist/plyr.css';

import { useAuthUser } from '@/hooks/auth/useAuthUser';

import { HiOutlinePlayCircle, HiOutlineSparkles } from 'react-icons/hi2';

const PLAYBACK_SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

const VideoPlayer = ({
  videoUrl,
  posterUrl,
  sessionId,
  isAdmin = false,
  className = '',
}) => {
  const videoRef = useRef(null);
  const playerShellRef = useRef(null);

  const plyrRef = useRef(null);
  const hlsRef = useRef(null);

  const watermarkRef = useRef(null);
  const watermarkIntervalRef = useRef(null);

  const completionRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  const [playerError, setPlayerError] = useState('');

  const [isPortrait, setIsPortrait] = useState(false);

  const [isVideoCompleted, setIsVideoCompleted] = useState(false);

  const { user } = useAuthUser();

  const watermarkText = user?.phone || user?.email || 'سمانه یوگا';

  useEffect(() => {
    completionRef.current = isVideoCompleted;
  }, [isVideoCompleted]);

  /*
   * دریافت وضعیت تکمیل جلسه
   */
  useEffect(() => {
    if (isAdmin || !sessionId || !user?.id) {
      setIsVideoCompleted(false);

      completionRef.current = false;

      return undefined;
    }

    const controller = new AbortController();

    const fetchCompletionStatus = async () => {
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

            signal: controller.signal,
          }
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json().catch(() => null);

        if (typeof result?.isCompleted === 'boolean') {
          completionRef.current = result.isCompleted;

          setIsVideoCompleted(result.isCompleted);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('[VIDEO_COMPLETION_STATUS_ERROR]', error);
        }
      }
    };

    fetchCompletionStatus();

    return () => {
      controller.abort();
    };
  }, [sessionId, isAdmin, user?.id]);

  /*
   * ساخت Plyr، HLS و Watermark
   */
  useEffect(() => {
    const video = videoRef.current;

    const playerShell = playerShellRef.current;

    if (!video || !playerShell || !videoUrl) {
      setIsReady(false);

      return undefined;
    }

    let disposed = false;

    let PlyrClass = null;
    let HlsClass = null;

    setIsReady(false);
    setPlayerError('');

    /*
     * حذف Watermark
     */
    const removeWatermark = () => {
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current);

        watermarkIntervalRef.current = null;
      }

      if (watermarkRef.current) {
        watermarkRef.current.remove();

        watermarkRef.current = null;
      }
    };

    /*
     * پیدا کردن Container واقعی تصویر.
     *
     * Watermark باید داخل این بخش قرار
     * بگیرد، نه داخل Container اصلی Plyr.
     */
    const getWatermarkHost = () => {
      const playerContainer = plyrRef.current?.elements?.container;

      if (!playerContainer) {
        return null;
      }

      return playerContainer.querySelector('.plyr__video-wrapper') || null;
    };

    /*
     * جابه‌جایی Watermark
     *
     * موقعیت بر اساس اندازه واقعی
     * Video Wrapper تعیین می‌شود.
     *
     * پایین تصویر عمداً رزرو می‌شود
     * تا Watermark روی Controls نیفتد.
     */
    const moveWatermark = () => {
      const watermark = watermarkRef.current;

      const watermarkHost = watermark?.parentElement || getWatermarkHost();

      if (!watermark || !watermarkHost) {
        return;
      }

      const containerRect = watermarkHost.getBoundingClientRect();

      const watermarkWidth = watermark.offsetWidth || 0;

      const watermarkHeight = watermark.offsetHeight || 0;

      /*
       * فاصله امن از لبه‌های تصویر
       */
      const horizontalPadding = Math.max(14, containerRect.width * 0.025);

      const verticalPadding = Math.max(14, containerRect.height * 0.035);

      /*
       * فضای پایین برای Controls
       */
      const controlsSafeArea = Math.max(64, containerRect.height * 0.16);

      const minX = horizontalPadding;

      const maxX = Math.max(
        minX,
        containerRect.width - watermarkWidth - horizontalPadding
      );

      const minY = verticalPadding;

      const maxY = Math.max(
        minY,
        containerRect.height - watermarkHeight - controlsSafeArea
      );

      const randomX = minX + Math.random() * Math.max(maxX - minX, 0);

      const randomY = minY + Math.random() * Math.max(maxY - minY, 0);

      watermark.style.left = `${randomX}px`;

      watermark.style.top = `${randomY}px`;
    };

    /*
     * Responsive font size
     */
    const updateWatermarkFontSize = () => {
      if (!watermarkRef.current) {
        return;
      }

      watermarkRef.current.style.fontSize =
        window.innerWidth <= 768 ? '11px' : '14px';
    };

    /*
     * ساخت Watermark
     *
     * تفاوت اصلی:
     * Watermark داخل
     * .plyr__video-wrapper
     * قرار می‌گیرد.
     */
    const createWatermark = (playerContainer) => {
      removeWatermark();

      if (!playerContainer) {
        return;
      }

      const videoWrapper = playerContainer.querySelector(
        '.plyr__video-wrapper'
      );

      if (!videoWrapper) {
        console.warn('[VIDEO_WATERMARK_HOST_NOT_FOUND]');

        return;
      }

      const watermark = document.createElement('div');

      watermark.textContent = watermarkText;

      watermark.className = 'teaching-yoga-video-watermark';

      /*
       * نکته اصلی:
       * Watermark داخل خود تصویر.
       */
      videoWrapper.appendChild(watermark);

      watermarkRef.current = watermark;

      updateWatermarkFontSize();

      /*
       * بعد از Mount شدن،
       * browser باید ابعاد Watermark
       * را محاسبه کند.
       */
      window.requestAnimationFrame(() => {
        if (!disposed) {
          moveWatermark();
        }
      });

      watermarkIntervalRef.current = window.setInterval(moveWatermark, 5000);
    };

    const showWatermark = () => {
      if (watermarkRef.current) {
        watermarkRef.current.style.opacity = '1';

        watermarkRef.current.style.visibility = 'visible';
      }
    };

    const hideWatermark = () => {
      if (watermarkRef.current) {
        watermarkRef.current.style.opacity = '0';

        watermarkRef.current.style.visibility = 'hidden';
      }
    };

    /*
     * ثبت تکمیل جلسه
     */
    const markSessionAsCompleted = async () => {
      if (isAdmin || !sessionId || !user?.id || completionRef.current) {
        return;
      }

      completionRef.current = true;

      setIsVideoCompleted(true);

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
          completionRef.current = false;

          setIsVideoCompleted(false);

          console.error('[VIDEO_MARK_COMPLETE_FAILED]', response.status);
        }
      } catch (error) {
        completionRef.current = false;

        setIsVideoCompleted(false);

        console.error('[VIDEO_MARK_COMPLETE_ERROR]', error);
      }
    };

    /*
     * Video events
     */
    const handleLoadedMetadata = () => {
      setIsPortrait(video.videoHeight > video.videoWidth);

      window.requestAnimationFrame(moveWatermark);
    };

    const handleTimeUpdate = () => {
      if (isAdmin || !sessionId || !user?.id || completionRef.current) {
        return;
      }

      const duration = Number(video.duration);

      const currentTime = Number(video.currentTime);

      if (
        Number.isFinite(duration) &&
        duration > 0 &&
        currentTime >= duration * 0.8
      ) {
        markSessionAsCompleted();
      }
    };

    const handlePlay = () => {
      showWatermark();
    };

    const handlePause = () => {
      if (video.currentTime > 0) {
        showWatermark();
      }
    };

    const handleEnded = () => {
      hideWatermark();
    };

    const handleFullscreenChange = () => {
      window.setTimeout(moveWatermark, 120);
    };

    /*
     * Cleanup Plyr / HLS
     */
    const destroyPlayer = () => {
      removeWatermark();

      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (error) {
          console.error('[HLS_DESTROY_ERROR]', error);
        }

        hlsRef.current = null;
      }

      if (plyrRef.current) {
        try {
          plyrRef.current.destroy();
        } catch (error) {
          console.error('[PLYR_DESTROY_ERROR]', error);
        }

        plyrRef.current = null;
      }
    };

    /*
     * ساخت Plyr
     */
    const createPlyr = (qualityOptions = [], qualityMap = new Map()) => {
      if (disposed || plyrRef.current || !PlyrClass) {
        return;
      }

      const hasQualityOptions = qualityOptions.length > 0;

      const player = new PlyrClass(video, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'settings',
          'fullscreen',
        ],

        settings: hasQualityOptions ? ['quality', 'speed'] : ['speed'],

        speed: {
          selected: 1,

          options: PLAYBACK_SPEED_OPTIONS,
        },

        ...(hasQualityOptions
          ? {
              quality: {
                default: 0,

                options: [0, ...qualityOptions],

                forced: true,

                onChange: (selectedQuality) => {
                  if (!hlsRef.current) {
                    return;
                  }

                  const normalizedQuality = Number(selectedQuality);

                  if (normalizedQuality === 0) {
                    hlsRef.current.currentLevel = -1;

                    return;
                  }

                  const levelIndex = qualityMap.get(normalizedQuality);

                  if (typeof levelIndex === 'number') {
                    hlsRef.current.currentLevel = levelIndex;
                  }
                },
              },

              i18n: {
                qualityLabel: {
                  0: 'خودکار',
                },
              },
            }
          : {}),
      });

      plyrRef.current = player;

      createWatermark(player?.elements?.container || playerShell);

      setIsReady(true);
    };

    /*
     * Initialize
     */
    const initializePlayer = async () => {
      try {
        const [plyrModule, hlsModule] = await Promise.all([
          import('plyr'),

          import('hls.js'),
        ]);

        if (disposed) {
          return;
        }

        PlyrClass = plyrModule.default || plyrModule;

        HlsClass = hlsModule.default || hlsModule;

        const isDirectVideoFile = /\.(mp4|webm|ogg)(?:$|\?)/i.test(videoUrl);

        const shouldUseHls = !isDirectVideoFile && HlsClass?.isSupported?.();

        if (shouldUseHls) {
          const hls = new HlsClass({
            autoStartLoad: true,

            startLevel: -1,

            capLevelToPlayerSize: true,

            enableWorker: true,
          });

          hlsRef.current = hls;

          hls.loadSource(videoUrl);

          hls.attachMedia(video);

          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            if (disposed) {
              return;
            }

            const qualityMap = new Map();

            const qualityOptions = [
              ...new Set(
                hls.levels
                  .map((level, levelIndex) => {
                    const height = Number(level?.height);

                    if (height > 0 && !qualityMap.has(height)) {
                      qualityMap.set(height, levelIndex);
                    }

                    return height;
                  })
                  .filter((height) => height > 0)
              ),
            ].sort((a, b) => a - b);

            createPlyr(qualityOptions, qualityMap);
          });

          hls.on(HlsClass.Events.ERROR, (_, data) => {
            if (!data?.fatal) {
              return;
            }

            switch (data.type) {
              case HlsClass.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();

                break;

              case HlsClass.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();

                break;

              default:
                setPlayerError('پخش ویدیو با خطا مواجه شد.');

                setIsReady(false);

                try {
                  hls.destroy();
                } catch {
                  // No action required.
                }

                hlsRef.current = null;

                break;
            }
          });

          return;
        }

        /*
         * MP4 یا HLS بومی Safari
         */
        video.src = videoUrl;

        createPlyr();
      } catch (error) {
        if (disposed) {
          return;
        }

        console.error('[VIDEO_PLAYER_INITIALIZATION_ERROR]', error);

        setPlayerError('آماده‌سازی پخش‌کننده ویدیو انجام نشد.');

        setIsReady(false);
      }
    };

    /*
     * Event listeners
     */
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    video.addEventListener('timeupdate', handleTimeUpdate);

    video.addEventListener('play', handlePlay);

    video.addEventListener('pause', handlePause);

    video.addEventListener('ended', handleEnded);

    window.addEventListener('resize', updateWatermarkFontSize);

    window.addEventListener('resize', moveWatermark);

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    initializePlayer();

    return () => {
      disposed = true;

      video.removeEventListener('loadedmetadata', handleLoadedMetadata);

      video.removeEventListener('timeupdate', handleTimeUpdate);

      video.removeEventListener('play', handlePlay);

      video.removeEventListener('pause', handlePause);

      video.removeEventListener('ended', handleEnded);

      window.removeEventListener('resize', updateWatermarkFontSize);

      window.removeEventListener('resize', moveWatermark);

      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      destroyPlayer();
    };
  }, [videoUrl, posterUrl, sessionId, isAdmin, user?.id, watermarkText]);

  /*
   * Empty video
   */
  if (!videoUrl) {
    return (
      <div
        className={`relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[24px] bg-black ${className}`}
      >
        <div className='relative z-10 px-5 text-center'>
          <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 text-secondary backdrop-blur-md'>
            <HiOutlinePlayCircle size={34} />
          </span>

          <h3 className='mt-4 text-sm font-black text-white sm:text-base'>
            ویدیوی معرفی در دسترس نیست
          </h3>

          <p className='mt-2 text-xs leading-6 text-white/60'>
            پس از انتشار ویدیو، از همین بخش قابل مشاهده خواهد بود.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`teaching-yoga-player relative flex w-full items-center justify-center overflow-hidden bg-black ${className}`}
    >
      <div
        ref={playerShellRef}
        className={`video-player-shell relative mx-auto overflow-hidden bg-black ${
          isPortrait
            ? 'aspect-[9/16] w-full max-w-[460px]'
            : 'aspect-video w-full'
        }`}
      >
        <video
          ref={videoRef}
          controls
          playsInline
          preload='metadata'
          crossOrigin='anonymous'
          poster={posterUrl || undefined}
          className='h-full w-full bg-black object-contain'
        />

        {!isReady && !playerError && (
          <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <span className='h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-secondary' />

              <div>
                <p className='text-xs font-bold text-white'>
                  در حال آماده‌سازی ویدیو
                </p>

                <p className='mt-1 text-[10px] text-white/50'>
                  چند لحظه صبر کنید...
                </p>
              </div>
            </div>
          </div>
        )}

        {playerError && (
          <div className='absolute inset-0 z-30 flex items-center justify-center bg-black px-5'>
            <div className='max-w-sm text-center'>
              <span className='mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/10 bg-white/10 text-secondary'>
                <HiOutlineSparkles size={30} />
              </span>

              <h3 className='mt-4 text-sm font-black text-white sm:text-base'>
                پخش ویدیو امکان‌پذیر نیست
              </h3>

              <p className='mt-2 text-xs leading-7 text-white/60'>
                {playerError}
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        /*
         * =========================
         * Player Base
         * =========================
         */

        .teaching-yoga-player {
          min-width: 0;
        }

        .video-player-shell {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #000;
          isolation: isolate;
        }

        .video-player-shell .plyr {
          position: relative;
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
          background: #000;
          transform: none !important;
          transition: none !important;
        }

        .video-player-shell .plyr:hover,
        .video-player-shell .plyr:focus-within {
          transform: none !important;
        }

        /*
         * بسیار مهم:
         * Watermark داخل همین wrapper
         * قرار می‌گیرد.
         */
        .video-player-shell .plyr__video-wrapper {
          position: relative !important;
          width: 100%;
          height: 100%;
          overflow: hidden !important;
          background: #000;
          transform: none !important;
        }

        .video-player-shell video {
          display: block;
          width: 100%;
          height: 100%;
          margin: 0;
          background: #000;
          object-fit: contain;
          transform: none !important;
        }

        /*
         * =========================
         * Watermark
         * =========================
         */

        .video-player-shell .teaching-yoga-video-watermark {
          position: absolute !important;

          top: 16px;
          left: 16px;

          z-index: 6;

          display: block !important;

          width: max-content;
          max-width: calc(100% - 28px);

          height: auto;

          margin: 0 !important;

          padding: 5px 9px;

          border: 1px solid rgba(255, 255, 255, 0.035);

          border-radius: 8px;

          background: rgba(0, 0, 0, 0.045);

          color: rgba(255, 255, 255, 0.2);

          font-family: inherit;

          font-size: 14px;

          font-weight: 500;

          line-height: 1.2;

          letter-spacing: 3px;

          text-align: center;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;

          pointer-events: none !important;

          user-select: none !important;

          -webkit-user-select: none !important;

          opacity: 1;

          visibility: visible;

          box-sizing: border-box;

          text-shadow:
            0 1px 2px rgba(0, 0, 0, 0.3),
            0 0 5px rgba(255, 255, 255, 0.03);

          transition:
            top 650ms cubic-bezier(0.4, 0, 0.2, 1),
            left 650ms cubic-bezier(0.4, 0, 0.2, 1),
            opacity 220ms ease;

          will-change: top, left, opacity;
        }

        /*
         * =========================
         * Center Play Button
         * =========================
         */

        .video-player-shell .plyr__control--overlaid {
          position: absolute !important;

          top: 50% !important;
          left: 50% !important;

          right: auto !important;
          bottom: auto !important;

          display: flex !important;

          align-items: center !important;

          justify-content: center !important;

          width: 74px !important;
          height: 74px !important;

          margin: 0 !important;

          padding: 0 !important;

          border: 1px solid rgba(255, 255, 255, 0.22) !important;

          border-radius: 9999px !important;

          background: rgba(38, 145, 125, 0.88) !important;

          color: #fff !important;

          box-shadow:
            0 15px 45px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset !important;

          backdrop-filter: blur(12px);

          -webkit-backdrop-filter: blur(12px);

          transform: translate(-50%, -50%) scale(1) !important;

          transform-origin: center !important;

          transition:
            background-color 220ms ease,
            box-shadow 220ms ease,
            opacity 220ms ease,
            transform 220ms ease !important;
        }

        .video-player-shell .plyr__control--overlaid:hover {
          background: rgba(38, 145, 125, 1) !important;

          transform: translate(-50%, -50%) scale(1.06) !important;

          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.3),
            0 0 0 7px rgba(38, 145, 125, 0.16) !important;
        }

        .video-player-shell .plyr__control--overlaid:active {
          transform: translate(-50%, -50%) scale(0.97) !important;
        }

        /*
         * Play triangle optical center
         */
        .video-player-shell .plyr__control--overlaid svg {
          display: block !important;

          width: 27px !important;
          height: 27px !important;

          margin: 0 !important;

          transform: translateX(2px) !important;

          transform-origin: center !important;

          fill: currentColor !important;
        }

        /*
         * =========================
         * Controls
         * =========================
         */

        .video-player-shell .plyr__controls {
          position: absolute !important;

          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;

          z-index: 7;

          width: 100% !important;

          padding: 42px 14px 12px !important;

          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.76) 0%,
            rgba(0, 0, 0, 0.42) 45%,
            transparent 100%
          ) !important;

          transform: none !important;

          transition: opacity 220ms ease !important;
        }

        .video-player-shell .plyr:hover .plyr__controls,
        .video-player-shell .plyr:focus-within .plyr__controls {
          transform: none !important;
        }

        .video-player-shell .plyr__controls .plyr__control {
          border-radius: 10px !important;

          transition:
            background-color 180ms ease,
            color 180ms ease !important;
        }

        .video-player-shell .plyr__controls .plyr__control:hover {
          background: rgba(38, 145, 125, 0.9) !important;
        }

        /*
         * =========================
         * Progress
         * =========================
         */

        .video-player-shell .plyr--full-ui input[type='range'] {
          color: rgb(38, 145, 125);
        }

        .video-player-shell .plyr__progress input[type='range'] {
          cursor: pointer;
        }

        .video-player-shell .plyr__progress__buffer {
          color: rgba(255, 255, 255, 0.22);
        }

        /*
         * =========================
         * Time
         * =========================
         */

        .video-player-shell .plyr__time {
          font-size: 12px !important;

          line-height: 1 !important;

          color: rgba(255, 255, 255, 0.9) !important;
        }

        /*
         * =========================
         * Menu
         * =========================
         */

        .video-player-shell .plyr__menu__container {
          border-radius: 14px !important;

          background: rgba(20, 24, 24, 0.95) !important;

          color: #fff !important;

          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.3) !important;

          backdrop-filter: blur(15px);

          -webkit-backdrop-filter: blur(15px);
        }

        /*
         * =========================
         * Mobile
         * =========================
         */

        @media (max-width: 640px) {
          .video-player-shell .teaching-yoga-video-watermark {
            padding: 4px 7px;

            font-size: 11px;

            letter-spacing: 2px;

            border-radius: 7px;
          }

          .video-player-shell .plyr__control--overlaid {
            width: 62px !important;

            height: 62px !important;
          }

          .video-player-shell .plyr__control--overlaid svg {
            width: 23px !important;

            height: 23px !important;

            transform: translateX(1.5px) !important;
          }

          .video-player-shell .plyr__controls {
            padding: 34px 8px 8px !important;
          }

          .video-player-shell .plyr__time {
            font-size: 10px !important;
          }
        }

        /*
         * =========================
         * Reduced Motion
         * =========================
         */

        @media (prefers-reduced-motion: reduce) {
          .video-player-shell .plyr__control--overlaid,
          .video-player-shell .teaching-yoga-video-watermark {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string,

  posterUrl: PropTypes.string,

  sessionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  isAdmin: PropTypes.bool,

  className: PropTypes.string,
};

export default VideoPlayer;
