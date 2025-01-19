/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import { setProgress } from '../../progress/route';

// S3 configuration
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Function to upload a file to S3
const uploadToS3 = async (fileData, key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: Buffer.from(fileData),
  };
  await s3.upload(params).promise();
};

// Upload files to S3
const uploadFilesToS3 = async (files, folderKey) => {
  const totalFiles = files.length;
  let fileKey = '';

  // حلقه برای پردازش هر فایل
  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const { name } = file; // گرفتن اطلاعات فایل

    // بررسی نوع فایل و اطمینان از این که داده‌ها به صورت Buffer هستند
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // به‌طور موقت فایل‌ها را در حافظه بارگذاری می‌کنید، نیازی به ذخیره در سیستم فایل نیست.
    const s3Key = `${folderKey}/${name}`;
    await uploadToS3(fileBuffer, s3Key);

    const uploadProgress = ((i + 1) / totalFiles) * 100;
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
  const files = [];
  for (const [key, value] of data.entries()) {
    if (key.startsWith('file_') && value instanceof Blob) {
      files.push(value);
    }
  }
  const courseName = data.get('courseName');

  if (!files || !courseName) {
    return NextResponse.json(
      { error: 'Please provide all required fields.' },
      { status: 400 },
    );
  }

  try {
    const folderKey = `videos/${courseName}/intro`;
    const videoKey = await uploadFilesToS3(files, folderKey);

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
