/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import prismadb from '@/libs/prismadb';
import { setProgress } from '../progress/route'; // Import the progress setter
import pLimit from 'p-limit';

const CONCURRENT_LIMIT = 2; // حداکثر وظایف همزمان
const limit = pLimit(CONCURRENT_LIMIT);

// تنظیمات S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// آپلود فایل به S3
const uploadToS3 = async (filePath, key) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileContent,
  };
  await s3.upload(params).promise();
};

let qualitiesForMaster = [];

const getQualities = ({ width, height }) => {
  const resolutions =
    width >= height
      ? [
          { resolution: '1920x1080', bitrate: '5000k' },
          { resolution: '1280x720', bitrate: '3000k' },
          { resolution: '854x480', bitrate: '1500k' },
          { resolution: '640x360', bitrate: '800k' },
          { resolution: '426x240', bitrate: '400k' },
        ]
      : [
          { resolution: '1080x1920', bitrate: '5000k' },
          { resolution: '720x1280', bitrate: '3000k' },
          { resolution: '480x854', bitrate: '1500k' },
          { resolution: '360x640', bitrate: '800k' },
          { resolution: '240x426', bitrate: '400k' },
        ];
  return resolutions;
};

// ذخیره اطلاعات ویدیو در پایگاه داده
const saveSessionVideo = async (videoKey, accessLevel, status, sessionId) => {
  try {
    const newSessionVideo = await prismadb.sessionVideo.create({
      data: {
        videoKey,
        accessLevel,
        status,
        session: { connect: { id: sessionId } },
      },
    });

    await prismadb.session.update({
      where: { id: sessionId },
      data: { isActive: true },
    });

    return newSessionVideo.id;
  } catch (error) {
    console.error('Error saving session video:', error);
    throw new Error('Failed to save session video');
  }
};

const getVideoDimensions = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const { width, height } = metadata.streams[0];
      resolve({ width, height });
    });
  });
};

const convertToHLS = async (tempFilePath, outputDir) => {
  const dimensions = await getVideoDimensions(tempFilePath);
  const qualities = getQualities(dimensions);
  qualitiesForMaster = qualities;

  let totalProgress = 0;
  const numTasks = qualities.length;

  const processQuality = async (quality) => {
    const fileName = `${quality.resolution}.m3u8`;

    return new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .outputOptions([
          '-preset ultrafast',
          '-g 48',
          '-sc_threshold 0',
          `-s ${quality.resolution}`,
          `-b:v ${quality.bitrate}`,
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls',
          '-crf 28',
        ])
        .output(path.join(outputDir, fileName))
        .on('progress', (progress) => {
          const progressPercent = progress.percent || 0;
          const ffmpegProgress = (progressPercent / 100 / numTasks) * 5;
          totalProgress += ffmpegProgress;
          setProgress(Math.min(totalProgress, 5));
        })
        .on('end', () => resolve())
        .on('error', (error) => reject(error))
        .run();
    });
  };

  const tasks = qualities.map((quality) =>
    limit(() => processQuality(quality)),
  );

  try {
    await Promise.all(tasks);
    console.log('All qualities processed successfully!');
    return qualitiesForMaster;
  } catch (error) {
    console.error('Error during HLS conversion:', error);
    throw error;
  }
};

const createMasterM3u8 = (outputDir) => {
  const masterFilePath = path.join(outputDir, 'master.m3u8');
  const masterContent =
    `#EXTM3U\n` +
    qualitiesForMaster
      .map(
        (quality) =>
          `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate)},RESOLUTION=${quality.resolution}\n${quality.resolution}.m3u8`,
      )
      .join('\n');

  fs.writeFileSync(masterFilePath, masterContent);
};

const uploadFilesToS3 = async (files, outputDir, folderKey) => {
  const totalFiles = files.length;
  let fileKey = '';

  for (let i = 0; i < totalFiles; i++) {
    const fileName = files[i];
    const filePath = path.join(outputDir, fileName);
    const s3Key = `${folderKey}/${fileName}`;
    await uploadToS3(filePath, s3Key);

    const uploadProgress = 5 + ((i + 1) / totalFiles) * 95;
    setProgress(uploadProgress);

    if (s3Key.endsWith('master.m3u8')) {
      fileKey = s3Key;
    }
  }
  return fileKey;
};

export async function POST(req) {
  const data = await req.formData();
  const file = data.get('video');
  const courseName = data.get('courseName');
  const termId = data.get('termId');
  const sessionId = data.get('sessionId');

  setProgress(0);

  if (!file || !courseName || !termId || !sessionId) {
    return NextResponse.json(
      { error: 'Please provide all required fields.' },
      { status: 400 },
    );
  }

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${uuidv4()}.mp4`);
  const fileStream = fs.createWriteStream(tempFilePath);
  fileStream.write(Buffer.from(await file.arrayBuffer()));

  const outputDir = path.join(tempDir, `${uuidv4()}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
  ffmpeg.setFfmpegPath(ffmpegPath);

  try {
    await convertToHLS(tempFilePath, outputDir);
    createMasterM3u8(outputDir);

    const files = fs.readdirSync(outputDir);
    const folderKey = `videos/${courseName}/${termId}/${sessionId}`;
    const videoKey = await uploadFilesToS3(files, outputDir, folderKey);

    try {
      fs.unlinkSync(tempFilePath);
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }

    const sessionVideoId = await saveSessionVideo(
      videoKey,
      'REGISTERED',
      'AVAILABLE',
      sessionId,
    );

    setProgress(100);

    return NextResponse.json({
      sessionVideoId,
      message: 'آپلود و ذخیره‌سازی موفقیت‌آمیز بود',
    });
  } catch (error) {
    console.error('Error converting/uploading video:', error);
    return NextResponse.json({ error: 'خطا در پردازش آپلود' }, { status: 500 });
  }
}
