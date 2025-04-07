/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// تنظیمات S3
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

// تابع آپلود به S3
const uploadToS3 = async (filePath, key) => {
  const fileContent = await fs.readFile(filePath);
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
  };
  await s3.upload(params).promise();
  return `${process.env.AWS_S3_BASE_URL}/${key}`;
};

// هندلر API
export async function POST(req) {
  const data = await req.formData();
  const file = data.get('file');
  const folderPath = data.get('folderPath');
  let fileName = data.get('fileName');

  if (!file || typeof file.arrayBuffer !== 'function' || !folderPath) {
    return NextResponse.json(
      { error: 'لطفاً فایل صوتی و مسیر پوشه را ارسال کنید.' },
      { status: 400 },
    );
  }

  // فرمت‌های مجاز صوتی
  const validAudioTypes = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/x-m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
  };

  const fileExtension = validAudioTypes[file.type];
  if (!fileExtension) {
    return NextResponse.json(
      { error: 'فقط فایل‌های صوتی (mp3, m4a, wav, ogg, webm) مجاز هستند.' },
      { status: 400 },
    );
  }

  // اضافه کردن پسوند اگر موجود نبود
  if (!fileName.endsWith(`.${fileExtension}`)) {
    fileName = `${fileName}.${fileExtension}`;
  }

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, fileName);

  try {
    // ذخیره فایل به صورت موقت
    await fs.writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

    // آپلود به S3
    const key = `${folderPath}/${fileName}`;
    const fileUrl = await uploadToS3(tempFilePath, key);

    return NextResponse.json({
      fileUrl,
      message: 'فایل صوتی با موفقیت آپلود شد.',
    });
  } catch (error) {
    console.error('خطا در آپلود فایل صوتی:', error);
    return NextResponse.json({ error: 'خطا در پردازش آپلود' }, { status: 500 });
  } finally {
    // حذف فایل موقت
    await fs
      .unlink(tempFilePath)
      .catch((err) => console.error('خطا در حذف فایل موقت:', err));
  }
}
