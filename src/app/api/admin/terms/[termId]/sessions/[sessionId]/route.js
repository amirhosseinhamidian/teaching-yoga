/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb'
import { NextResponse } from 'next/server'
import AWS from 'aws-sdk'

// ===============================
//           DELETE
// ===============================
export async function DELETE(req, { params }) {
  const { termId, sessionId } = params

  // AWS SDK v2
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT,
    s3ForcePathStyle: true,
  })

  try {
    // 1) دریافت جلسه
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      include: { video: true, audio: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'جلسه یافت نشد.' }, { status: 404 })
    }

    // 2) چک حضور جلسه در ترم‌های دیگر
    const otherLinks = await prismadb.sessionTerm.findMany({
      where: {
        sessionId,
        NOT: { termId: parseInt(termId) },
      },
    })

    // 3) حذف لینک این ترم
    await prismadb.sessionTerm.deleteMany({
      where: {
        termId: parseInt(termId),
        sessionId,
      },
    })

    // 4) ساماندهی مجدد order
    const remaining = await prismadb.sessionTerm.findMany({
      where: { termId: parseInt(termId) },
      orderBy: { order: 'asc' },
    })

    await Promise.all(
      remaining.map((st, idx) =>
        prismadb.sessionTerm.update({
          where: { id: st.id },
          data: { order: idx + 1 },
        })
      )
    )

    // اگر جلسه در ترم دیگر هست، فقط unlink می‌کنیم و برمی‌گردیم
    if (otherLinks.length > 0) {
      return NextResponse.json(
        { message: 'جلسه فقط از این ترم حذف شد.' },
        { status: 200 }
      )
    }

    // ========== حذف کامل جلسه + فایل‌ها ==========
    // --- حذف فایل ویدیو ---
    if (session.video?.videoKey) {
      try {
        const videoKey = session.video.videoKey.replace('/master.m3u8', '')

        const listObjects = await s3
          .listObjectsV2({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Prefix: videoKey,
          })
          .promise()

        if (listObjects?.Contents?.length > 0) {
          await s3
            .deleteObjects({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Delete: {
                Objects: listObjects.Contents.map((o) => ({ Key: o.Key })),
              },
            })
            .promise()
        }
      } catch (err) {
        console.error('Error deleting video file:', err)
      }
    }

    // --- حذف فایل صوتی ---
    if (session.audio?.audioKey) {
      try {
        await s3
          .deleteObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: session.audio.audioKey,
          })
          .promise()
      } catch (err) {
        console.error('Error deleting audio file:', err)
      }
    }

    // --- حذف رکوردهای دیتابیس ---
    const trx = [
      prismadb.sessionProgress.deleteMany({ where: { sessionId } }),
      prismadb.session.delete({ where: { id: sessionId } }),
    ]

    if (session.video)
      trx.push(
        prismadb.sessionVideo.delete({ where: { id: session.video.id } })
      )

    if (session.audio)
      trx.push(
        prismadb.sessionAudio.delete({ where: { id: session.audio.id } })
      )

    await prismadb.$transaction(trx)

    return NextResponse.json(
      { message: 'جلسه کاملاً حذف شد.' },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error deleting session:', err)
    return NextResponse.json({ error: 'خطا در حذف جلسه.' }, { status: 500 })
  }
}
// ===============================
//             PUT
// ===============================
export async function PUT(req, { params }) {
  const { termId, sessionId } = params

  try {
    const { name, duration, accessLevel, type, order } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'عنوان جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'مدت زمان باید عددی معتبر باشد.' },
        { status: 400 }
      )
    }

    if (
      !accessLevel ||
      !['PUBLIC', 'REGISTERED', 'PURCHASED'].includes(accessLevel)
    ) {
      return NextResponse.json(
        { error: 'سطح دسترسی مدیا معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!order || typeof order !== 'number') {
      return NextResponse.json(
        { error: 'ترتیب جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      include: { video: true, audio: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'جلسه‌ای با این شناسه یافت نشد.' },
        { status: 404 }
      )
    }

    // ===============================
    // بروزرسانی Session
    // ===============================

    const updateData = {
      name,
      duration,
    }

    if (type === 'VIDEO' && session.video) {
      updateData.video = { update: { accessLevel } }
    }

    if (type === 'AUDIO' && session.audio) {
      updateData.audio = { update: { accessLevel } }
    }

    // بروزرسانی order در SessionTerm
    await prismadb.sessionTerm.updateMany({
      where: { sessionId, termId: parseInt(termId) },
      data: { order },
    })

    const updatedSession = await prismadb.session.update({
      where: { id: sessionId },
      data: updateData,
      include: { video: true, audio: true },
    })

    return NextResponse.json(
      { message: 'جلسه با موفقیت بروزرسانی شد.', updatedSession },
      { status: 200 }
    )
  } catch (e) {
    console.error('Error updating session:', e)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی جلسه.' },
      { status: 500 }
    )
  }
}
