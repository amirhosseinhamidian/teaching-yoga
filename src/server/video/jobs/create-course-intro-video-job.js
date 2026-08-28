import prismadb from '@/libs/prismadb';

import {
  ActiveVideoJobConflictError,
} from './active-video-job-conflict-error';

import {
  lockVideoJobTarget,
} from './lock-video-job-target';

const ACTIVE_JOB_STATUSES = [
  'UPLOADING',
  'QUEUED',
  'PROCESSING',
  'PUBLISHING',
];

const normalizeCourseTitle = (value) => {
  const courseTitle =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  if (!courseTitle) {
    throw new Error('Course title is required.');
  }

  if (courseTitle.length > 200) {
    throw new Error('Course title is too long.');
  }

  if (
    courseTitle.includes('/') ||
    courseTitle.includes('\\') ||
    courseTitle.includes('\0') ||
    courseTitle === '.' ||
    courseTitle === '..'
  ) {
    throw new Error('Course title contains invalid path characters.');
  }

  return courseTitle;
};

const normalizeOptionalCourseId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const courseId = Number(value);

  if (!Number.isInteger(courseId) || courseId <= 0) {
    throw new Error('courseId must be a positive integer.');
  }

  return courseId;
};

export async function createCourseIntroVideoJob({
  courseId,
  courseTitle,
  createdByUserId,
}) {
  const normalizedCourseId = normalizeOptionalCourseId(courseId);

  const normalizedCourseTitle = normalizeCourseTitle(courseTitle);

  const normalizedCreatedByUserId =
    typeof createdByUserId === 'string'
      ? createdByUserId.trim()
      : '';

  if (!normalizedCreatedByUserId) {
    throw new Error(
      'createdByUserId is required.'
    );
  }

  const targetKey =
    normalizedCourseId
      ? `course-intro:id:${normalizedCourseId}`
      : `course-intro:title:${normalizedCourseTitle}`;

  return prismadb.$transaction(
    async (tx) => {
      await lockVideoJobTarget({
        tx,
        key: targetKey,
      });

      const activeJob =
        await tx.videoProcessingJob.findFirst({
          where: {
            targetType:
              'COURSE_INTRO',

            status: {
              in: ACTIVE_JOB_STATUSES,
            },

            ...(normalizedCourseId
              ? {
                  courseId:
                    normalizedCourseId,
                }
              : {
                  courseId: null,

                  courseTitle:
                    normalizedCourseTitle,
                }),
          },

          orderBy: {
            createdAt: 'desc',
          },
        });

      if (activeJob) {
        throw new ActiveVideoJobConflictError(
          activeJob
        );
      }

      if (normalizedCourseId) {
        const course =
          await tx.course.findUnique({
            where: {
              id:
                normalizedCourseId,
            },

            select: {
              id: true,
            },
          });

        if (!course) {
          throw new Error(
            'Course was not found.'
          );
        }
      }

      return tx.videoProcessingJob.create({
        data: {
          targetType:
            'COURSE_INTRO',

          createdByUserId:
            normalizedCreatedByUserId,

          courseId:
            normalizedCourseId,

          courseTitle:
            normalizedCourseTitle,

          sessionId: null,
          termId: null,

          status: 'UPLOADING',
          uploadProgress: 0,
          progress: 0,
        },
      });
    }
  );
}
