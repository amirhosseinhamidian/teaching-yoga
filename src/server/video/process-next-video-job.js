/* eslint-disable no-undef */
import path from 'node:path';
import { access, mkdir, rm } from 'node:fs/promises';

import { getVideoStorage } from '@/server/storage';

import {
  claimNextVideoJob,
  markVideoJobFailed,
  markVideoJobPublishing,
  updateVideoJobProgress,
} from '@/server/video/jobs';

import { publishVideoJob } from '@/server/video/publish-video-job';

import { probeVideo } from '@/server/video/ffmpeg/probe-video';
import { generateHls } from '@/server/video/ffmpeg/generate-hls';

const DEFAULT_PROCESSING_ROOT = './storage/processing/jobs';

const getProcessingRoot = () =>
  path.resolve(
    process.cwd(),
    process.env.VIDEO_PROCESSING_ROOT || DEFAULT_PROCESSING_ROOT
  );

const ensureFileExists = async (filePath) => {
  try {
    await access(filePath);
  } catch {
    throw new Error(`The source video file does not exist: ${filePath}`);
  }
};

const normalizeCourseFolderName = (value) => {
  const folderName =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  if (!folderName) {
    throw new Error('The course intro job does not have a course title.');
  }

  if (
    folderName.includes('/') ||
    folderName.includes('\\') ||
    folderName.includes('\0') ||
    folderName === '.' ||
    folderName === '..'
  ) {
    throw new Error('The course title contains invalid path characters.');
  }

  return folderName;
};

const getOutputPrefix = (job) => {
  switch (job.targetType) {
    case 'SESSION_VIDEO': {
      if (typeof job.sessionId !== 'string' || !job.sessionId) {
        throw new Error('The session video job does not have a sessionId.');
      }

      if (!Number.isInteger(job.termId) || job.termId <= 0) {
        throw new Error('The session video job does not have a valid termId.');
      }

      return `videos/${job.termId}/${job.sessionId}`;
    }

    case 'COURSE_INTRO': {
      const folderName = normalizeCourseFolderName(job.courseTitle);

      return `videos/${folderName}/intro`;
    }

    default:
      throw new Error(`Unsupported video job target: ${job.targetType}`);
  }
};

export async function processNextVideoJob() {
  const job = await claimNextVideoJob();

  if (!job) {
    return {
      processed: false,
      message: 'No queued video job was found.',
    };
  }

  const processingDirectory = path.join(getProcessingRoot(), job.id);

  const hlsOutputDirectory = path.join(processingDirectory, 'hls');

  try {
    if (!job.sourcePath) {
      throw new Error('The video job does not have a source path.');
    }

    const sourcePath = path.resolve(process.cwd(), job.sourcePath);

    await ensureFileExists(sourcePath);

    await rm(processingDirectory, {
      recursive: true,
      force: true,
    });

    await mkdir(hlsOutputDirectory, {
      recursive: true,
    });

    const metadata = await probeVideo(sourcePath);

    let lastDatabaseProgress = 1;

    const generationResult = await generateHls({
      sourcePath,
      outputDirectory: hlsOutputDirectory,
      metadata,
      onProgress: (ffmpegProgress) => {
        const jobProgress = Math.max(
          2,
          Math.min(89, Math.round(ffmpegProgress * 0.88))
        );

        if (jobProgress < lastDatabaseProgress + 2) {
          return;
        }

        lastDatabaseProgress = jobProgress;

        updateVideoJobProgress({
          jobId: job.id,
          progress: jobProgress,
        }).catch((error) => {
          console.error('Video progress update error:', error);
        });
      },
    });

    await access(generationResult.masterPlaylistPath);

    await markVideoJobPublishing(job.id);

    const storage = getVideoStorage();
    const outputPrefix = getOutputPrefix(job);

    await storage.saveDirectory(hlsOutputDirectory, outputPrefix);

    const outputKey = `${outputPrefix}/master.m3u8`;

    const masterExists = await storage.exists(outputKey);

    if (!masterExists) {
      throw new Error('The published master playlist could not be verified.');
    }

    const publishResult = await publishVideoJob({
      jobId: job.id,
      outputKey,
    });

    await Promise.all([
      rm(processingDirectory, {
        recursive: true,
        force: true,
      }),

      rm(path.dirname(sourcePath), {
        recursive: true,
        force: true,
      }),
    ]);

    return {
      processed: true,
      job: publishResult.job,
      video: publishResult.video,
      course: publishResult.course,
      metadata,
      profiles: generationResult.profiles,
      publicUrl: storage.getPublicUrl(outputKey),
    };
  } catch (error) {
    await markVideoJobFailed({
      jobId: job.id,
      error,
    }).catch((statusError) => {
      console.error('Failed to mark video job as failed:', statusError);
    });

    await rm(processingDirectory, {
      recursive: true,
      force: true,
    }).catch(() => {});

    throw error;
  }
}
