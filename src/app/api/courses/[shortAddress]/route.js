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
        courseTerms: {
          // Updated to match the new relation with CourseTerm
          include: {
            term: {
              // Include the related Term model
              include: {
                sessions: true, // Sessions for each term
              },
            },
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

    // Calculate total price, average discount, and final price
    const terms = course.courseTerms.map((courseTerm) => courseTerm.term) || [];
    const totalPrice = terms.reduce((sum, term) => sum + (term.price || 0), 0);

    const totalDiscount = terms.reduce(
      (sum, term) => sum + (term.discount || 0),
      0,
    );

    const averageDiscount =
      terms.length > 0 ? Math.ceil(totalDiscount / terms.length) : 0;

    const finalPrice = terms.reduce((sum, term) => {
      const termPrice = term.price || 0;
      const termDiscount = term.discount || 0;
      const discountedPrice = termPrice - (termPrice * termDiscount) / 100;
      return sum + discountedPrice;
    }, 0);

    // Add calculated values to the response
    const responseData = {
      ...course,
      price: totalPrice, // مجموع قیمت
      discount: averageDiscount, // میانگین تخفیف
      finalPrice, // قیمت نهایی
    };

    // If introVideoUrl exists, generate a temporary signed URL for it
    if (course.introVideoUrl) {
      const signedUrl = await generateTemporaryLink(course.introVideoUrl);
      responseData.introLink = signedUrl; // Add the signed URL to introLink
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
