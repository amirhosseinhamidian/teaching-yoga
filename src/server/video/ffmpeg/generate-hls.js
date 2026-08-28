/* eslint-disable no-undef */
import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const PORTRAIT_PROFILES = [
  {
    name: '720x1280',
    width: 720,
    height: 1280,
    videoBitrate: '2200k',
    maxRate: '2500k',
    bufferSize: '4000k',
    audioBitrate: '128k',
  },
  {
    name: '480x854',
    width: 480,
    height: 854,
    videoBitrate: '1400k',
    maxRate: '1600k',
    bufferSize: '2400k',
    audioBitrate: '96k',
  },
  {
    name: '360x640',
    width: 360,
    height: 640,
    videoBitrate: '700k',
    maxRate: '850k',
    bufferSize: '1200k',
    audioBitrate: '96k',
  },
];

const LANDSCAPE_PROFILES = [
  {
    name: '1280x720',
    width: 1280,
    height: 720,
    videoBitrate: '3000k',
    maxRate: '3500k',
    bufferSize: '5000k',
    audioBitrate: '128k',
  },
  {
    name: '854x480',
    width: 854,
    height: 480,
    videoBitrate: '1400k',
    maxRate: '1600k',
    bufferSize: '2400k',
    audioBitrate: '96k',
  },
  {
    name: '640x360',
    width: 640,
    height: 360,
    videoBitrate: '700k',
    maxRate: '850k',
    bufferSize: '1200k',
    audioBitrate: '96k',
  },
];

const UPSCALE_TOLERANCE = 1.1;

const getProfiles = (metadata) => {
  const profiles =
    metadata.height >= metadata.width ? PORTRAIT_PROFILES : LANDSCAPE_PROFILES;

  const availableProfiles = profiles.filter(
    (profile) =>
      profile.width <= metadata.width * UPSCALE_TOLERANCE &&
      profile.height <= metadata.height * UPSCALE_TOLERANCE
  );

  if (availableProfiles.length > 0) {
    return availableProfiles;
  }

  // اگر ویدئو رزولوشن خیلی پایین داشت
  // حداقل یک خروجی با سایز اصلی بساز
  const width = metadata.width % 2 === 0 ? metadata.width : metadata.width - 1;

  const height =
    metadata.height % 2 === 0 ? metadata.height : metadata.height - 1;

  return [
    {
      name: `${width}x${height}`,
      width,
      height,
      videoBitrate: '600k',
      maxRate: '750k',
      bufferSize: '1000k',
      audioBitrate: '96k',
    },
  ];
};

const parseKbps = (value) => {
  if (typeof value !== 'string') {
    return 0;
  }

  const match = /^([0-9]+(?:\.[0-9]+)?)k$/i.exec(
    value.trim()
  );

  if (!match) {
    return 0;
  }

  return Number(match[1]) * 1000;
};

export const estimateHlsOutputBytes = (metadata) => {
  const duration = Number(metadata?.duration);

  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  const profiles = getProfiles(metadata);

  const totalBitsPerSecond = profiles.reduce(
    (sum, profile) => {
      const videoBitsPerSecond =
        parseKbps(profile.maxRate) ||
        parseKbps(profile.videoBitrate);

      const audioBitsPerSecond =
        metadata.hasAudio
          ? parseKbps(profile.audioBitrate)
          : 0;

      return (
        sum +
        videoBitsPerSecond +
        audioBitsPerSecond
      );
    },
    0
  );

  /*
   * حدود ۱۰٪ برای container/HLS overhead و نوسان bitrate.
   * برای preflight فضای دیسک عمداً محافظه‌کارانه است.
   */
  return Math.ceil(
    (totalBitsPerSecond * duration) /
      8 *
      1.1
  );
};

const parseProgressLine = (line, duration) => {
  const [key, rawValue] = line.trim().split('=');

  if ((key !== 'out_time_us' && key !== 'out_time_ms') || !rawValue) {
    return null;
  }

  const processedSeconds = Number(rawValue) / 1_000_000;

  if (!Number.isFinite(processedSeconds)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(100, Math.round((processedSeconds / duration) * 100))
  );
};

export async function generateHls({
  sourcePath,
  outputDirectory,
  metadata,
  onProgress,
}) {
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

  const profiles = getProfiles(metadata);

  await mkdir(outputDirectory, {
    recursive: true,
  });

  const args = ['-hide_banner', '-y', '-i', sourcePath];

  /*
    Mapping Streams
  */

  for (let index = 0; index < profiles.length; index += 1) {
    args.push('-map', '0:v:0');

    if (metadata.hasAudio) {
      args.push('-map', '0:a:0?');
    }
  }

  /*
    Encoding profiles
  */

  for (let index = 0; index < profiles.length; index += 1) {
    const profile = profiles[index];

    args.push(
      `-c:v:${index}`,
      'libx264',

      `-preset:v:${index}`,
      'medium',

      `-profile:v:${index}`,
      'main',

      `-crf:v:${index}`,
      '18',

      `-b:v:${index}`,
      profile.videoBitrate,

      `-maxrate:v:${index}`,
      profile.maxRate,

      `-bufsize:v:${index}`,
      profile.bufferSize,

      `-vf:v:${index}`,
      [
        `scale=${profile.width}:${profile.height}:force_original_aspect_ratio=decrease`,
        `pad=${profile.width}:${profile.height}:(ow-iw)/2:(oh-ih)/2`,
        'setsar=1',
      ].join(','),

      `-force_key_frames:v:${index}`,
      'expr:gte(t,n_forced*6)'
    );

    if (metadata.hasAudio) {
      args.push(
        `-c:a:${index}`,
        'aac',

        `-b:a:${index}`,
        profile.audioBitrate,

        `-ac:a:${index}`,
        '2',

        `-ar:a:${index}`,
        '48000'
      );
    }
  }

  const variantStreamMap = profiles
    .map((profile, index) =>
      metadata.hasAudio
        ? `v:${index},a:${index},name:${profile.name}`
        : `v:${index},name:${profile.name}`
    )
    .join(' ');

  args.push(
    '-sn',

    '-f',
    'hls',

    '-hls_time',
    '6',

    '-hls_playlist_type',
    'vod',

    '-hls_flags',
    'independent_segments',

    '-master_pl_name',
    'master.m3u8',

    '-var_stream_map',
    variantStreamMap,

    '-hls_segment_filename',
    path.join(outputDirectory, '%v_%03d.ts'),

    path.join(outputDirectory, '%v.m3u8'),

    '-progress',
    'pipe:1',

    '-nostats'
  );

  await new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    let progressBuffer = '';
    let lastProgress = -1;

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      progressBuffer += chunk;

      const lines = progressBuffer.split('\n');

      progressBuffer = lines.pop() || '';

      for (const line of lines) {
        const progress = parseProgressLine(line, metadata.duration);

        if (progress !== null && progress !== lastProgress) {
          lastProgress = progress;

          onProgress?.(progress);
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;

      if (stderr.length > 30000) {
        stderr = stderr.slice(-30000);
      }
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.trim()}`));

        return;
      }

      resolve();
    });
  });

  return {
    profiles,

    masterPlaylistPath: path.join(outputDirectory, 'master.m3u8'),
  };
}
