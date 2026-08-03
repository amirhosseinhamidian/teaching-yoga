import { createChildLogger } from '@/server/logger';

export const videoWorkerLogger = createChildLogger({
  component: 'video-worker',
});

export const getVideoJobLogger = (jobOrId, bindings = {}) => {
  if (typeof jobOrId === 'string') {
    return videoWorkerLogger.child({
      jobId: jobOrId,
      ...bindings,
    });
  }

  const job = jobOrId || {};

  return videoWorkerLogger.child({
    jobId: job.id || null,

    targetType: job.targetType || null,

    sessionId: job.sessionId || null,

    termId: job.termId || null,

    courseId: job.courseId || null,

    attempt: job.attempts || 0,

    ...bindings,
  });
};
