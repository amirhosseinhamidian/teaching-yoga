import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export const processVideo = async (file, isLandscape, onProgress) => {
  const ffmpeg = createFFmpeg({
    log: true,
    corePath:
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
  });

  // متغیر برای پیگیری پیشرفت کلی
  let totalProgress = 0;
  let completedSteps = 0;

  const qualities = isLandscape
    ? [
        { resolution: '1280x720', bitrate: '2000k' },
        { resolution: '854x480', bitrate: '1000k' },
        { resolution: '640x360', bitrate: '600k' },
      ]
    : [
        { resolution: '720x1280', bitrate: '2000k' },
        { resolution: '480x854', bitrate: '1000k' },
        { resolution: '360x640', bitrate: '600k' },
      ];

  const totalSteps = qualities.length;

  // مدیریت پیشرفت در هر مرحله
  ffmpeg.setProgress(({ ratio }) => {
    const stepProgress = Math.round(ratio * 100); // پیشرفت مرحله فعلی
    totalProgress = Math.round(
      (completedSteps * 100 + stepProgress) / totalSteps,
    ); // محاسبه پیشرفت کلی

    onProgress(totalProgress);
  });

  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const inputFileName = 'input.mp4';
  ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

  const outputFiles = [];
  const m3u8Entries = [];

  for (const { resolution, bitrate } of qualities) {
    const playlistName = `output_${resolution.replace('x', '_')}.m3u8`;
    const segmentPattern = `segment_${resolution.replace('x', '_')}_%03d.ts`;
    await ffmpeg.run(
      '-i',
      inputFileName,
      '-preset',
      'medium', // سرعت پردازش و کیفیت متعادل
      '-crf',
      '23', // فشرده‌سازی بهتر
      '-r',
      '24', // کاهش نرخ فریم
      '-g',
      '90', // افزایش فاصله بین keyframeها
      '-keyint_min',
      '90',
      '-s',
      resolution, // رزولوشن خروجی (داینامیک)
      '-b:v',
      bitrate, // نرخ بیت ویدیو (داینامیک)
      '-c:v',
      'libx264', // استفاده از H.264
      '-c:a',
      'aac', // کدک صوتی
      '-b:a',
      '128k', // نرخ بیت صدا
      '-ac',
      '1', // کاهش کانال‌های صوتی
      '-hls_time',
      '6', // کاهش مدت زمان قطعه‌های HLS
      '-hls_list_size',
      '0',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      segmentPattern,
      '-f',
      'hls',
      playlistName,
    );
    // اضافه کردن ورودی جدید به M3U8
    m3u8Entries.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(bitrate)},RESOLUTION=${resolution}\n${playlistName}`,
    );

    // اضافه کردن فایل‌های خروجی این مرحله
    const files = ffmpeg
      .FS('readdir', '.')
      .filter(
        (name) =>
          name.startsWith(`segment_${resolution.replace('x', '_')}`) ||
          name === playlistName,
      );

    files.forEach((file) => {
      outputFiles.push({
        name: file,
        data: ffmpeg.FS('readFile', file),
      });
    });

    // افزایش شمارش مراحل کامل‌شده
    completedSteps++;
  }

  // ایجاد فایل Master M3U8
  const masterName = 'master.m3u8';
  const masterContent = `#EXTM3U\n${m3u8Entries.join('\n')}`;
  ffmpeg.FS('writeFile', masterName, new TextEncoder().encode(masterContent));

  outputFiles.push({
    name: masterName,
    data: ffmpeg.FS('readFile', masterName),
  });

  return outputFiles;
};
