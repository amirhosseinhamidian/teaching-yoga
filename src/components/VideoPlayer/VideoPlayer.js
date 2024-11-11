'use client';
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const options = {
    autoplay: false,
    controls: true,
    preload: 'auto',
    sources: [
      {
        src: src,
        type: 'video/mp4',
      },
    ],
  };

  useEffect(() => {
    console.log('Video source:', src);
    console.log('Poster image:', poster);
    if (videoRef.current && !playerRef.current) {
      const player = videojs(videoRef.current, options, () => {});
      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [src]);

  return (
    <div className='h-auto w-full rounded-xl'>
      <div data-vjs-player>
        <video className='rounded-xl' controls poster={poster} preload='auto'>
          <source src={src} type='video/mp4' />
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;
