/* eslint-disable no-undef */
// app/api/generate-video-link/route.js

import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
});

export async function POST(request) {
  const { videoKey } = await request.json();

  if (!videoKey) {
    return new Response(JSON.stringify({ error: 'Video key is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: videoKey,
      Expires: 7200, // Expiry time in seconds (e.g., 2 hours)
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', params);

    return new Response(JSON.stringify({ signedUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate signed URL' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
