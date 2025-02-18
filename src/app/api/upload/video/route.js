/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { setProgress } from '../progress/route';

// تنظیمات S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
  httpOptions: {
    timeout: 3000000, // 5 دقیقه
    connectTimeout: 1200000, // 2 دقیقه
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// تابع آپلود به S3
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
  if (width >= height) {
    // horizontal
    return [
      { resolution: '1280x720', bitrate: '2000k' },
      { resolution: '854x480', bitrate: '1000k' },
      { resolution: '640x360', bitrate: '600k' },
    ];
  } else {
    // vertical
    return [
      { resolution: '720x1280', bitrate: '2000k' },
      { resolution: '480x854', bitrate: '1000k' },
      { resolution: '360x640', bitrate: '600k' },
    ];
  }
};

const getVideoDimensions = (filePath) => {
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

// پردازش ویدیو و تبدیل به HLS

const convertToHLS = async (tempFilePath, outputDir) => {
  const dimensions = await getVideoDimensions(tempFilePath);
  const qualities = getQualities(dimensions);
  qualitiesForMaster = qualities;

  let totalProgress = 0;
  const numTasks = qualities.length;

  return Promise.all(
    qualities.map(
      (quality) =>
        new Promise((resolve, reject) => {
          const fileName = `${quality.resolution}.m3u8`;
          ffmpeg(tempFilePath)
            .outputOptions([
              '-preset medium', // سرعت پردازش و کیفیت متعادل
              '-crf 23', // فشرده‌سازی بهتر
              '-r 24', // کاهش نرخ فریم
              '-g 90', // افزایش فاصله بین keyframeها
              '-keyint_min 90',
              '-s ' + quality.resolution, // رزولوشن خروجی
              '-b:v ' + quality.bitrate, // نرخ بیت ویدیو
              '-c:v libx264', // استفاده از H.264
              '-c:a aac', // کدک صوتی
              '-b:a 128k', // نرخ بیت صدا
              '-ac 1', // کاهش کانال‌های صوتی
              '-hls_time 6', // کاهش مدت زمان قطعه‌های HLS
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
    qualitiesForMaster
      .map((quality) => {
        return `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(quality.bitrate)},RESOLUTION=${quality.resolution}\n${quality.resolution}.m3u8`;
      })
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

    const uploadProgress = 5 + ((i + 1) / totalFiles) * 95; // Map upload progress to 50%-100%
    setProgress(uploadProgress);

    // Return fileKey immediately if "master.m3u8" is found
    if (s3Key.endsWith('master.m3u8')) {
      fileKey = s3Key;
    }
  }
  return fileKey; // If no master.m3u8 was found, return empty string
};

const saveFilesLocally = async (files, outputDir, termId, sessionId) => {
  const baseFolder = 'H:\\videos'; // مسیر اصلی ذخیره‌سازی
  const relativePath = path.join('videos', termId, sessionId);
  const localFolder = path.join(baseFolder, termId, sessionId); // مسیر نهایی شامل termId/sessionId

  if (!fs.existsSync(localFolder)) {
    fs.mkdirSync(localFolder, { recursive: true });
  }

  console.log(`📁 فایل‌ها در این مسیر ذخیره می‌شوند: ${localFolder}`);

  let totalLocalSize = 0;
  let fileKey = '';

  files.forEach((file) => {
    const filePath = path.join(outputDir, file);
    const destPath = path.join(localFolder, file);
    fs.copyFileSync(filePath, destPath);

    const fileSize = fs.statSync(destPath).size;
    totalLocalSize += fileSize;

    console.log(
      `📂 ذخیره شد: ${destPath} | حجم: ${(fileSize / 1024 / 1024).toFixed(2)} MB`,
    );

    // ذخیره fileKey برای فایل master.m3u8
    if (file.endsWith('master.m3u8')) {
      fileKey = path.join(relativePath, file).replace(/\\/g, '/');
    }
  });

  console.log(
    `📊 مجموع حجم فایل‌های ذخیره‌شده: ${(totalLocalSize / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`🔑 مسیر فایل Master: ${fileKey}`);

  return fileKey;
};

// API پردازش و آپلود ویدیو
export async function POST(req) {
  const data = await req.formData();
  const file = data.get('video');
  const termId = data.get('termId');
  const sessionId = data.get('sessionId');

  setProgress(0);

  if (!file || !termId || !sessionId) {
    return NextResponse.json(
      { error: 'لطفاً تمام فیلدهای لازم را ارسال کنید.' },
      { status: 400 },
    );
  }

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, `${uuidv4()}.mp4`);
  fs.writeFileSync(tempFilePath, Buffer.from(await file.arrayBuffer()));

  const outputDir = path.join(tempDir, `${uuidv4()}`);
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // ۱. پردازش ویدیو با FFmpeg
    await convertToHLS(tempFilePath, outputDir);
    await createMasterM3u8(outputDir);

    // ۲. خواندن فایل‌های پردازش‌شده
    const files = fs.readdirSync(outputDir);
    console.log('📁 فایل‌های پردازش‌شده:', files);

    // ۳. ذخیره فایل‌ها در مسیر مشخص‌شده
    const videoKey = await saveFilesLocally(
      files,
      outputDir,
      termId,
      sessionId,
    );

    // ۴. حذف فایل‌های موقت
    try {
      fs.unlinkSync(tempFilePath);
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }

    // // ۳. آپلود فایل‌ها به S3
    // const folderKey = `videos/${termId}/${sessionId}`;
    // const videoKey = await uploadFilesToS3(files, outputDir, folderKey);

    // // ۴. حذف فایل‌های موقت
    // try {
    //   fs.unlinkSync(tempFilePath);
    //   fs.rmSync(outputDir, { recursive: true, force: true });
    // } catch (cleanupError) {
    //   console.error('Error cleaning up temporary files:', cleanupError);
    // }

    setProgress(100);

    return NextResponse.json({
      videoKey,
      message: 'پردازش و آپلود موفقیت‌آمیز بود.',
    });
  } catch (error) {
    console.error('خطا در پردازش ویدیو:', error);
    return NextResponse.json({ error: 'خطا در پردازش ویدیو' }, { status: 500 });
  }
}
