/* eslint-disable no-undef */
'use client';
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

const VideoPlayer = ({
  videoUrl,
  posterUrl,
  sessionId,
  userId,
  isAdmin = false,
}) => {
  const playerRef = useRef(null);
  let hls;

  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const markVideoAsCompleted = async () => {
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
          headers: {
            'Content-Type': 'application/json',
            userId: userId,
          },
        },
      );

      const data = await response.json();
      if (data.isCompleted !== undefined) {
        setIsVideoCompleted(data.isCompleted); // وضعیت تکمیل را در state ذخیره می‌کنیم
      }
    } catch (error) {
      console.error('Error fetching video completion status:', error);
    }
  };

  useEffect(() => {
    if (!isAdmin && sessionId) fetchVideoCompletionStatus();
    const video = playerRef.current;

    // تنظیم پوستر برای ویدیو
    if (posterUrl) {
      video.poster = posterUrl;
    }

    if (Hls.isSupported()) {
      hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
      });
      // بارگذاری فایل m3u8 با استفاده از loadSource
      hls.loadSource(videoUrl); // استفاده از `loadSource` برای بارگذاری master.m3u8
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        new Plyr(video, {
          controls: [
            'play-large', // دکمه پخش بزرگ
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'fullscreen',
            'settings',
          ],
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl; // در صورتی که HLS پشتیبانی نمی‌شود
    }

    if (userId) {
      video.ontimeupdate = () => {
        const currentTime = video.currentTime;
        // بررسی 80% ویدیو مشاهده شده
        if (
          !isVideoCompleted &&
          videoDuration > 0 &&
          currentTime >= videoDuration * 0.8
        ) {
          setIsVideoCompleted(true);
        }
      };

      video.onloadedmetadata = () => {
        setVideoDuration(video.duration); // ذخیره مدت زمان ویدیو
      };
    }

    return () => {
      // در هنگام رندر مجدد، پلیر را تمیز کنیم
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoUrl, posterUrl, videoDuration]);

  useEffect(() => {
    if (isVideoCompleted) {
      markVideoAsCompleted();
    }
  }, [isVideoCompleted, markVideoAsCompleted]);

  return (
    <div className='plyr-container overflow-hidden rounded-xl'>
      <video
        ref={playerRef}
        controls
        crossOrigin='anonymous'
        className='w-full'
      />
    </div>
  );
};

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  posterUrl: PropTypes.string,
  sessionId: PropTypes.string,
  userId: PropTypes.string,
  isAdmin: PropTypes.bool,
};

export default VideoPlayer;
