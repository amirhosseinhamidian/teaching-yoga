/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { useAuthUser } from '@/hooks/auth/useAuthUser';

const VideoPlayer = ({ videoUrl, posterUrl, sessionId, isAdmin = false }) => {
  const playerRef = useRef(null);
  const hlsRef = useRef(null);
  const watermarkRef = useRef(null);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [speedOptions] = useState([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
  const { user } = useAuthUser();
  const [videoDimensions, setVideoDimensions] = useState({
    width: 16,
    height: 9,
  });
  let isPortrait;

  const markVideoAsCompleted = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-progress/${sessionId}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ completed: true }),
        }
      );
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  const fetchVideoCompletionStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/session-progress/${sessionId}/complete`,
        {
          method: 'GET',
        }
      );

      const data = await response.json();
      if (data.isCompleted !== undefined) {
        setIsVideoCompleted(data.isCompleted);
      }
    } catch (error) {
      console.error('Error fetching video completion status:', error);
    }
  };

  const moveWatermark = () => {
    if (watermarkRef.current) {
      const playerRect = document.fullscreenElement
        ? document.fullscreenElement.getBoundingClientRect()
        : playerRef.current.getBoundingClientRect();

      const maxX = playerRect.width - watermarkRef.current.offsetWidth - 20;
      const maxY = playerRect.height - watermarkRef.current.offsetHeight - 20;

      const randomX = Math.max(20, Math.random() * maxX);
      const randomY = Math.max(20, Math.random() * maxY);

      watermarkRef.current.style.left = `${randomX}px`;
      watermarkRef.current.style.top = `${randomY}px`;
    }
  };

  useEffect(() => {
    if (!isAdmin && sessionId) fetchVideoCompletionStatus();
    const video = playerRef.current;

    const onFullscreenChange = () => {
      try {
        if (document.fullscreenElement) {
          playerRef.current.style.height = '100%';
        } else {
          updatePlayerSize();
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (posterUrl) {
      video.poster = posterUrl;
    }

    if (!watermarkRef.current) {
      // ایجاد یک ظرف برای ویدیو و واترمارک
      const videoContainer = document.createElement('div');
      videoContainer.style.position = 'relative';
      videoContainer.style.width = '100%';
      videoContainer.style.height = '100%';

      // انتقال ویدیو داخل این ظرف
      video.parentElement.insertBefore(videoContainer, video);
      videoContainer.appendChild(video);

      // ایجاد و اضافه کردن واترمارک داخل ویدیو
      const watermarkElement = document.createElement('div');
      watermarkElement.innerText = user?.phone || user?.email || 'سمانه یوگا';
      watermarkElement.style.position = 'absolute';
      watermarkElement.style.pointerEvents = 'none';
      watermarkElement.style.color = 'rgba(255, 70, 70, 0.7)';
      watermarkElement.style.fontSize = '16px';
      watermarkElement.style.zIndex = '10000';
      watermarkElement.style.opacity = '0.7';
      watermarkElement.style.fontWeight = 'bold';
      watermarkElement.style.padding = '5px 10px';
      watermarkElement.style.display = 'hidden';

      videoContainer.appendChild(watermarkElement);
      watermarkRef.current = watermarkElement;
    }

    const updateFontSize = () => {
      if (window.innerWidth <= 768) {
        watermarkRef.current.style.fontSize = '12px';
      } else {
        watermarkRef.current.style.fontSize = '16px';
      }
    };

    updateFontSize();
    window.addEventListener('resize', updateFontSize);

    const updateVideoSize = () => {
      if (video.videoWidth && video.videoHeight) {
        setVideoDimensions({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      }
    };
    isPortrait = videoDimensions.height > videoDimensions.width;

    video.addEventListener('loadedmetadata', updateVideoSize);

    const updatePlayerSize = () => {
      if (isPortrait) {
        if (window.innerWidth >= 1536) {
          playerRef.current.style.height = '666px';
        } else if (window.innerWidth < 1536 && window.innerWidth >= 1280) {
          playerRef.current.style.height = '522px';
        } else if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
          playerRef.current.style.height = '451px';
        } else if (window.innerWidth < 1024 && window.innerWidth >= 768) {
          playerRef.current.style.height = '396px';
        } else if (window.innerWidth < 768 && window.innerWidth >= 640) {
          playerRef.current.style.height = '324px';
        } else {
          playerRef.current.style.height = 'auto';
        }
      }
    };

    updatePlayerSize();
    window.addEventListener('resize', updatePlayerSize);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    moveWatermark();

    // حرکت واترمارک در فواصل زمانی
    const watermarkInterval = setInterval(moveWatermark, 5000); // هر 5 ثانیه

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const availableQualities = hls.levels.map((level, index) => ({
          label: level.height,
          value: index,
        }));

        new Plyr(video, {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'fullscreen',
            'settings',
          ],
          settings: ['quality', 'speed'],
          quality: {
            default: 'auto',
            options: ['auto', ...availableQualities.map((q) => q.label)],
            forced: true,
            onChange: (newQuality) => {
              if (hlsRef.current) {
                const video = playerRef.current;
                const currentTime = video.currentTime;
                const wasPlaying = !video.paused;
                const quality = availableQualities.find(
                  (quality) => quality.label === newQuality
                );
                hlsRef.current.currentLevel =
                  newQuality === 'auto' ? -1 : quality.value;

                setTimeout(() => {
                  video.currentTime = currentTime;
                  if (wasPlaying) video.play();
                }, 100);
              }
            },
          },
          speed: {
            selected: 1, // مقدار پیش‌فرض سرعت پخش
            options: speedOptions, // تنظیمات سرعت
            onChange: (newSpeed) => {
              const video = playerRef.current;
              video.playbackRate = newSpeed; // تغییر سرعت پخش ویدیو
            },
          },
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    }

    // رویدادهای پلی و پاز برای نمایش/مخفی کردن واترمارک
    video.addEventListener('play', () => {
      watermarkRef.current.style.display = 'block'; // نمایش واترمارک هنگام پخش
    });

    video.addEventListener('pause', () => {
      watermarkRef.current.style.display = 'block'; // واترمارک هنگام توقف هم نمایش داده شود
    });

    video.addEventListener('ended', () => {
      watermarkRef.current.style.display = 'none'; // واترمارک بعد از پایان ویدیو مخفی شود
    });

    if (user?.id) {
      video.ontimeupdate = () => {
        const currentTime = video.currentTime;
        if (
          !isVideoCompleted &&
          videoDuration > 0 &&
          currentTime >= videoDuration * 0.8
        ) {
          setIsVideoCompleted(true);
        }
      };

      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      clearInterval(watermarkInterval);
      window.removeEventListener('resize', updateFontSize);
      window.removeEventListener('resize', updatePlayerSize);
      window.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('loadedmetadata', updateVideoSize);
    };
  }, [videoUrl, posterUrl, videoDuration]);

  useEffect(() => {
    if (isVideoCompleted) {
      markVideoAsCompleted();
    }
  }, [isVideoCompleted]);

  return (
    <div
      className='relative flex items-center justify-center overflow-hidden rounded-xl'
      style={{
        width: '100%',
        backgroundColor: 'black', // پس‌زمینه مشکی برای ویدیوهای عمودی
        position: 'relative',
      }}
    >
      <video
        ref={playerRef}
        controls
        crossOrigin='anonymous'
        style={{
          display: 'block', // از ایجاد فضای اضافی جلوگیری می‌کند
          maxWidth: isPortrait ? 'auto' : '100%', // ویدیوهای افقی کل عرض را بگیرند
          maxHeight: isPortrait ? '100%' : 'auto', // ویدیوهای عمودی ارتفاع را بگیرند
          position: 'relative',
        }}
      />
    </div>
  );
};

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  posterUrl: PropTypes.string,
  sessionId: PropTypes.string,
  isAdmin: PropTypes.bool,
};

export default VideoPlayer;
