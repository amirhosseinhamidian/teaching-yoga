import { getRequestLogger } from '@/server/logger/request-context';

export const getAdminVideoJobLogger = ({
  job = null,
  jobId = null,
  actor = null,
  component = 'admin-video-jobs',
} = {}) => {
  return getRequestLogger({
    component,

    actorUserId: actor?.id || null,
    actorRole: actor?.role || null,

    jobId: job?.id || jobId || null,

    targetType: job?.targetType || null,

    sessionId: job?.sessionId || null,
    termId: job?.termId || null,

    courseId: job?.courseId || null,

    jobStatus: job?.status || null,
  });
};
