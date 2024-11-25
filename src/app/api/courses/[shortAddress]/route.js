/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// AWS S3 Client Initialization
const s3 = new AWS.S3();

// Generate a temporary link
async function generateTemporaryLink(videoKey) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: videoKey,
    Expires: 7200, // Expiry time in seconds (2 hours)
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    return signedUrl;
  } catch (error) {
    console.error('Error generating temporary link:', error);
    throw new Error('Unable to generate temporary link');
  }
}

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;

    // Fetch course details from the database
    const course = await prismadb.course.findUnique({
      where: {
        shortAddress: shortAddress,
      },
      include: {
        instructor: {
          include: {
            user: true,
          },
        },
        terms: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 },
      );
    }
    // If introVideoUrl exists, generate a temporary signed URL for it
    if (course.introVideoUrl) {
      const signedUrl = await generateTemporaryLink(course.introVideoUrl);
      course.introLink = signedUrl; // Add the signed URL to introLink
    }

    // Return the course details along with the introLink
    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
