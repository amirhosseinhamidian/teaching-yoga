/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { S3 } from 'aws-sdk';

export async function DELETE(req, { params }) {
  const { termId, sessionId } = params;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_S3_ENDPOINT;
  const bucket = process.env.AWS_S3_BUCKET_NAME;

  const s3 = new S3({
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3ForcePathStyle: true,
  });

  try {
    // دریافت اطلاعات جلسه از پایگاه داده
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      include: { video: true, sessionProgress: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'جلسه یافت نشد.' }, { status: 404 });
    }

    // حذف ویدیو از فضای ذخیره‌سازی لیارا
    if (session.video?.videoKey) {
      const videoKey = session.video.videoKey.replace('/master.m3u8', ''); // مسیر پوشه ویدیویی

      // لیست کردن فایل‌ها در پوشه
      const listObjectsResponse = await s3
        .listObjectsV2({ Bucket: bucket, Prefix: videoKey })
        .promise();

      if (listObjectsResponse.Contents) {
        const deleteObjectsParams = {
          Bucket: bucket,
          Delete: {
            Objects: listObjectsResponse.Contents.map((file) => ({
              Key: file.Key,
            })),
          },
        };

        // حذف تمام فایل‌ها در پوشه
        await s3.deleteObjects(deleteObjectsParams).promise();
      }
    } else {
      console.error('No video found for session');
    }

    // حذف رکوردهای مرتبط در جداول پایگاه داده
    if (session.video) {
      try {
        await prismadb.sessionVideo.delete({
          where: { id: session.video.id },
        });
      } catch (error) {
        console.error('Error deleting session video:', error);
      }
    }

    await prismadb.$transaction([
      prismadb.sessionProgress.deleteMany({
        where: { sessionId },
      }),
      prismadb.session.delete({
        where: {
          id: sessionId,
          termId: parseInt(termId),
        },
      }),
    ]);

    // به‌روزرسانی ترتیب باقی‌مانده جلسات در ترم
    const remainingSessions = await prismadb.session.findMany({
      where: { termId: parseInt(termId) },
      orderBy: { order: 'asc' }, // ترتیب بر اساس فیلد order
    });

    const updatedSessions = remainingSessions.map((session, index) => {
      return prismadb.session.update({
        where: { id: session.id },
        data: { order: index + 1 }, // به‌روزرسانی ترتیب هر جلسه
      });
    });

    // صبر کردن تا تمامی به‌روزرسانی‌ها انجام شود
    await Promise.all(updatedSessions);

    return NextResponse.json(
      { message: 'جلسه و اطلاعات مرتبط با موفقیت حذف شدند.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'خطا در حذف جلسه.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { termId, sessionId } = params;

  try {
    const { name, duration, accessLevel } = await req.json();

    // اعتبارسنجی داده‌های ورودی
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'عنوان جلسه معتبر نیست.' },
        { status: 400 },
      );
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'مدت زمان باید عددی معتبر باشد.' },
        { status: 400 },
      );
    }

    if (
      !accessLevel ||
      !['PUBLIC', 'REGISTERED', 'PURCHASED'].includes(accessLevel)
    ) {
      return NextResponse.json(
        { error: 'سطح دسترسی ویدیو معتبر نیست.' },
        { status: 400 },
      );
    }

    // بروزرسانی جلسه در دیتابیس
    const updatedSession = await prismadb.session.update({
      where: {
        id: sessionId, // شناسه جلسه
        termId: parseInt(termId), // شناسه ترم
      },
      data: {
        name,
        duration,
        video: {
          update: {
            accessLevel,
          },
        },
      },
      include: {
        video: true,
      },
    });

    return NextResponse.json(
      { message: 'جلسه با موفقیت بروزرسانی شد.', updatedSession },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی جلسه.' },
      { status: 500 },
    );
  }
}
