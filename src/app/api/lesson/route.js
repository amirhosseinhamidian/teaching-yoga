/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import AWS from 'aws-sdk';

// AWS S3 settings
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
});

// Generate a temporary link
async function generateTemporaryLink(videoKey) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: videoKey,
    Expires: 7200, // Expiry time in seconds (1 hour)
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('Error generating temporary link:', error);
    throw new Error('Unable to generate temporary link');
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'A valid session ID is required' },
      { status: 400 },
    );
  }

  try {
    // Fetch session details
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        name: true,
        duration: true,
        isFree: true,
        video: {
          select: {
            id: true,
            videoKey: true, // Updated field
            accessLevel: true,
            status: true,
          },
        },
        term: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate temporary link for the videoKey
    let videoLink = await generateTemporaryLink(session.video.videoKey);

    // Add the temporary link to the response
    const response = {
      ...session,
      videoLink, // Include the temporary link
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 },
    );
  }
}
