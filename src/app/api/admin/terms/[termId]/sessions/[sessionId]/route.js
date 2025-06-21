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
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      include: {
        video: true,
        audio: true,
        sessionProgress: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'جلسه یافت نشد.' }, { status: 404 });
    }

    // 🎥 حذف ویدیو
    if (session.video?.videoKey) {
      const videoKey = session.video.videoKey.replace('/master.m3u8', '');

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

        await s3.deleteObjects(deleteObjectsParams).promise();
      }
    }

    // 🔊 حذف فایل صوتی تکی
    if (session.audio?.audioKey) {
      try {
        await s3
          .deleteObject({
            Bucket: bucket,
            Key: `audio/${termId}/${sessionId}/audio.mp3`,
          })
          .promise();
      } catch (err) {
        console.error('Error deleting audio file from storage:', err);
      }
    }

    // 🧹 حذف رکوردهای دیتابیس
    if (session.video) {
      try {
        await prismadb.sessionVideo.delete({
          where: { id: session.video.id },
        });
      } catch (error) {
        console.error('Error deleting session video:', error);
      }
    }

    if (session.audio) {
      try {
        await prismadb.sessionAudio.delete({
          where: { id: session.audio.id },
        });
      } catch (error) {
        console.error('Error deleting session audio:', error);
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

    const remainingSessions = await prismadb.session.findMany({
      where: { termId: parseInt(termId) },
      orderBy: { order: 'asc' },
    });

    const updatedSessions = remainingSessions.map((session, index) =>
      prismadb.session.update({
        where: { id: session.id },
        data: { order: index + 1 },
      }),
    );

    await Promise.all(updatedSessions);

    return NextResponse.json(
      { message: 'جلسه و محتوای آن با موفقیت حذف شد.' },
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
    const { name, duration, accessLevel, type } = await req.json();

    // اعتبارسنجی داده‌ها
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
        { error: 'سطح دسترسی مدیا معتبر نیست.' },
        { status: 400 },
      );
    }

    // ساخت شیء data برای بروزرسانی
    const data = {
      name,
      duration,
    };

    // اگر نوع مدیا ویدیو بود، سطح دسترسی ویدیو را بروز کن
    if (type === 'VIDEO') {
      data.video = {
        update: {
          accessLevel,
        },
      };
    }

    // اگر نوع مدیا صوت بود، سطح دسترسی صوت را بروز کن
    if (type === 'AUDIO') {
      data.audio = {
        update: {
          accessLevel,
        },
      };
    }

    const updatedSession = await prismadb.session.update({
      where: {
        id: sessionId,
        termId: parseInt(termId),
      },
      data,
      include: {
        video: true,
        audio: true,
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
