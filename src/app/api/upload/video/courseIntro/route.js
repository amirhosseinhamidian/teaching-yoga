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
const convertToHLS = async (tempFilePath, outputDir) => {
  let totalProgress = 0;
  const numTasks = resolutions.length;

  return Promise.all(
    resolutions.map(
      (quality) =>
        new Promise((resolve, reject) => {
          const fileName = `${quality.resolution}.m3u8`;
          const outputPath = path.join(outputDir, fileName);

          // تبدیل ویدیو به فرمت HLS
          ffmpeg(tempFilePath)
            .outputOptions([
              '-preset veryfast',
              '-g 48',
              '-sc_threshold 0',
              `-s ${quality.resolution}`,
              `-b:v ${quality.bitrate}`,
              '-hls_time 6', // این مقدار باید کم باشد تا فایل TS در اندازه مناسب تقسیم شود
              '-hls_list_size 0', // جلوگیری از محدودیت در تعداد فایل‌های TS
              '-f hls',
              '-hls_segment_filename',
              `${path.join(outputDir, `${quality.resolution}-%03d.ts`)}`,
            ])
            .output(outputPath)
            .on('progress', (progress) => {
              const progressPercent = progress.percent || 0;
              const ffmpegProgress = (progressPercent / 100 / numTasks) * 5;
              totalProgress += ffmpegProgress;
              setProgress(Math.min(totalProgress, 5)); // درصد پیشرفت
            })
            .on('end', resolve)
            .on('error', (error) => {
              console.error('Error during ffmpeg processing', error);
              reject(error);
            })
            .run();
        }),
    ),
  );
};

// Create the master.m3u8 file
const createMasterM3u8 = async (outputDir) => {
  const masterFilePath = path.join(outputDir, 'master.m3u8');
  const masterContent =
    `#EXTM3U\n` +
    resolutions
      .map((quality) => {
        return `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate)},RESOLUTION=${quality.resolution}\n${quality.resolution}.m3u8`;
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

    const uploadProgress = 5 + ((i + 1) / totalFiles) * 95; // Map upload progress to 50%-100%
    setProgress(uploadProgress);

    // Return fileKey immediately if "master.m3u8" is found
    if (s3Key.endsWith('master.m3u8')) {
      fileKey = s3Key;
    }
  }
  return fileKey; // If no master.m3u8 was found, return empty string
};

// Route handler
export async function POST(req) {
  const data = await req.formData();
  const file = data.get('video');

  if (!file) {
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

  ffmpeg.setFfmpegPath('C:\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe');

  try {
    // Convert video to HLS (0% to 50%)
    await convertToHLS(tempFilePath, outputDir);

    // Create master.m3u8 file
    await createMasterM3u8(outputDir);

    // Upload files to S3 (50% to 100%)
    const files = fs.readdirSync(outputDir);
    const folderKey = `videos/intros`;
    const videoKey = await uploadFilesToS3(files, outputDir, folderKey);

    // Clean up temporary files
    fs.unlinkSync(tempFilePath);
    fs.rmSync(outputDir, { recursive: true, force: true });

    // Send final completion progress (100%)
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
