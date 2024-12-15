/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { setProgress } from '../../progress/route';

// S3 configuration
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

const resolutions = [
  { resolution: '1920x1080', bitrate: '5000k' },
  { resolution: '1280x720', bitrate: '3000k' },
  { resolution: '854x480', bitrate: '1500k' },
  { resolution: '640x360', bitrate: '800k' },
  { resolution: '426x240', bitrate: '400k' },
];

// Helper function to get video dimensions
const getVideoDimensions = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const { width, height } = metadata.streams[0];
        resolve({ width, height });
      }
    });
  });
};

// Filter resolutions based on video dimensions
const getQualities = ({ width, height }) => {
  return resolutions.filter(
    (res) =>
      parseInt(res.resolution.split('x')[0]) <= width &&
      parseInt(res.resolution.split('x')[1]) <= height,
  );
};

// Function to upload a file to S3
const uploadToS3 = async (filePath, key) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
  };
  await s3.upload(params).promise();
};

// Convert video to HLS
export const convertToHLS = async (tempFilePath, outputDir) => {
  const dimensions = await getVideoDimensions(tempFilePath);
  const qualities = getQualities(dimensions);

  let totalProgress = 0;
  const numTasks = qualities.length;

  const processQuality = async (quality) => {
    const fileName = `${quality.resolution}.m3u8`;

    console.log('start ffmpeg');

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
        ])
        .output(path.join(outputDir, fileName))
        .on('progress', (progress) => {
          const progressPercent = progress.percent || 0;
          const ffmpegProgress = (progressPercent / 100 / numTasks) * 5;
          totalProgress += ffmpegProgress;
          setProgress(Math.min(totalProgress, 5));
        })
        .on('end', () => {
          console.log(`Conversion for ${quality.resolution} completed.`);
          resolve();
        })
        .on('error', (error, stdout, stderr) => {
          console.error('FFmpeg error:', error.message);
          console.log('FFmpeg stdout:', stdout);
          console.log('FFmpeg stderr:', stderr);
          console.error(
            `Error during ffmpeg processing for ${quality.resolution}`,
            error,
          );
          reject(error);
        })
        .run();
    });
  };

  // Process all qualities
  await Promise.all(qualities.map(processQuality));
  return qualities;
};

// Create the master.m3u8 file
const createMasterM3u8 = async (outputDir, qualities) => {
  const masterFilePath = path.join(outputDir, 'master.m3u8');
  const masterContent =
    `#EXTM3U\n` +
    qualities
      .map((quality) => {
        return `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(
          quality.bitrate,
        )},RESOLUTION=${quality.resolution}\n${quality.resolution}.m3u8`;
      })
      .join('\n');

  fs.writeFileSync(masterFilePath, masterContent);
};

// Upload files to S3
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

// Route handler
export async function POST(req) {
  const data = await req.formData();
  const file = data.get('video');
  const courseName = data.get('courseName');

  if (!file || !courseName) {
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
    const qualities = await convertToHLS(tempFilePath, outputDir);

    await createMasterM3u8(outputDir, qualities);

    const files = fs.readdirSync(outputDir);
    const folderKey = `videos/${courseName}/intro`;
    const videoKey = await uploadFilesToS3(files, outputDir, folderKey);

    fs.unlinkSync(tempFilePath);
    fs.rmSync(outputDir, { recursive: true, force: true });

    setProgress(100);

    return NextResponse.json({
      videoKey,
      message: 'آپلود موفقیت‌آمیز بود',
    });
  } catch (error) {
    console.error('Error converting/uploading video:', error);
    return NextResponse.json({ error: 'خطا در پردازش آپلود' }, { status: 500 });
  }
}
