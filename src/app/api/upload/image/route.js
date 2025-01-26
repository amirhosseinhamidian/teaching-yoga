/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// S3 Configuration
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

// Upload function
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

// Route handler
export async function POST(req) {
  const data = await req.formData();
  const file = data.get('file');
  const folderPath = data.get('folderPath');
  let fileName = data.get('fileName');

  if (!file || typeof file.arrayBuffer !== 'function' || !folderPath) {
    return NextResponse.json(
      { error: 'Please provide a valid file and folderPath.' },
      { status: 400 },
    );
  }

  // Allowed image types
  const validImageTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/jpg': 'jpg',
  };

  // Validate file type
  const fileExtension = validImageTypes[file.type];
  if (!fileExtension) {
    return NextResponse.json(
      { error: 'Only image files (jpeg, png, gif, webp, jpg) are allowed.' },
      { status: 400 },
    );
  }

  // Add extension to fileName if missing
  if (!fileName.endsWith(`.${fileExtension}`)) {
    fileName = `${fileName}.${fileExtension}`;
  }

  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, fileName);

  try {
    // Save file to temp directory
    await fs.writeFile(tempFilePath, Buffer.from(await file.arrayBuffer()));

    // Upload to S3
    const key = `${folderPath}/${fileName}`;
    const fileUrl = await uploadToS3(tempFilePath, key);

    return NextResponse.json({
      fileUrl,
      message: 'آپلود موفقیت‌آمیز بود',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'خطا در پردازش آپلود' }, { status: 500 });
  } finally {
    // Clean up temporary file
    await fs
      .unlink(tempFilePath)
      .catch((err) => console.error('Error deleting temp file:', err));
  }
}
