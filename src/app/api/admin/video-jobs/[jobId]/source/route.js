import { NextResponse } from 'next/server';

import { getVideoJob } from '@/server/video/jobs';

import {
  deleteJobUploadDirectory,
  saveSourceVideo,
  SourceVideoUploadError,
} from '@/server/video/uploads/source-video';
import prismadb from '@/libs/prismadb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'application/octet-stream',
]);

const getFileName = (request) => {
  const value = request.headers.get('x-file-name') || 'source.mp4';

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export async function PUT(request, { params }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const { jobId } = await params;
  let sourceSaved = false;

  try {
    const job = await getVideoJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video processing job not found.',
        },
        {
          status: 404,
        }
      );
    }

    if (job.status !== 'UPLOADING') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot upload a source video for a job with status ${job.status}.`,
        },
        {
          status: 409,
        }
      );
    }

    const contentType = (request.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported video content type.',
        },
        {
          status: 415,
        }
      );
    }

    const contentLengthHeader = request.headers.get('content-length');

    const contentLength = contentLengthHeader
      ? Number(contentLengthHeader)
      : null;

    const savedVideo = await saveSourceVideo({
      jobId,
      body: request.body,
      fileName: getFileName(request),
      contentLength,
      signal: request.signal,
    });

    sourceSaved = true;

    const queuedJob = await prismadb.videoProcessingJob.update({
      where: {
        id: jobId,
      },
      data: {
        sourcePath: savedVideo.sourcePath,
        status: 'QUEUED',
        uploadProgress: 100,
        progress: 0,
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      file: {
        sourcePath: savedVideo.sourcePath,
        size: savedVideo.size,
      },
      job: queuedJob,
    });
  } catch (error) {
    if (sourceSaved) {
      await deleteJobUploadDirectory(jobId).catch((cleanupError) => {
        console.error('Source video cleanup error:', cleanupError);
      });
    }

    console.error('Source video upload error:', error);

    const status =
      error instanceof SourceVideoUploadError ? error.statusCode : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error.',
      },
      {
        status,
      }
    );
  }
}
