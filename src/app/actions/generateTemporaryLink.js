/* eslint-disable no-undef */
import AWS from 'aws-sdk';

// تنظیمات AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
});

// تابع برای ساخت لینک موقت
export async function generateTemporaryLink(videoKey) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: videoKey,
    Expires: 7200, // زمان انقضا به ثانیه
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('Error generating temporary link:', error);
    throw new Error('Unable to generate temporary link');
  }
}
