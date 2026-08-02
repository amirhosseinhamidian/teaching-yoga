import prismadb from '@/libs/prismadb';

const requireNonEmptyString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
};

const publishSessionVideo = async ({ tx, job, outputKey }) => {
  if (!job.sessionId) {
    throw new Error('The session video job does not have a sessionId.');
  }

  const session = await tx.session.findUnique({
    where: {
      id: job.sessionId,
    },

    select: {
      id: true,
      videoId: true,
    },
  });

  if (!session) {
    throw new Error('The session for this video job was not found.');
  }

  let sessionVideo;

  if (session.videoId) {
    sessionVideo = await tx.sessionVideo.update({
      where: {
        id: session.videoId,
      },

      data: {
        videoKey: outputKey,
        accessLevel: job.accessLevel,
        status: 'AVAILABLE',
      },
    });
  } else {
    sessionVideo = await tx.sessionVideo.create({
      data: {
        videoKey: outputKey,
        accessLevel: job.accessLevel,
        status: 'AVAILABLE',
      },
    });
  }

  await tx.session.update({
    where: {
      id: session.id,
    },

    data: {
      videoId: sessionVideo.id,
      type: 'VIDEO',
      isActive: true,
    },
  });

  return {
    video: sessionVideo,
    course: null,
  };
};

const publishCourseIntro = async ({ tx, job, outputKey }) => {
  /*
   * در ساخت دوره جدید هنوز courseId نداریم.
   * در آن حالت فقط outputKey داخل Job ثبت می‌شود
   * و فرم بعداً آن را در create-course ارسال می‌کند.
   */
  if (!job.courseId) {
    return {
      video: null,
      course: null,
    };
  }

  const course = await tx.course.findUnique({
    where: {
      id: job.courseId,
    },

    select: {
      id: true,
    },
  });

  if (!course) {
    throw new Error('The course for this intro video job was not found.');
  }

  const updatedCourse = await tx.course.update({
    where: {
      id: course.id,
    },

    data: {
      introVideoUrl: outputKey,
    },
  });

  return {
    video: null,
    course: updatedCourse,
  };
};

export async function publishVideoJob({ jobId, outputKey }) {
  const normalizedJobId = requireNonEmptyString(jobId, 'jobId');

  const normalizedOutputKey = requireNonEmptyString(outputKey, 'outputKey');

  return prismadb.$transaction(async (tx) => {
    const job = await tx.videoProcessingJob.findUnique({
      where: {
        id: normalizedJobId,
      },

      select: {
        id: true,
        targetType: true,

        sessionId: true,
        termId: true,

        courseId: true,
        courseTitle: true,

        accessLevel: true,
        status: true,
      },
    });

    if (!job) {
      throw new Error('The video processing job was not found.');
    }

    if (job.status !== 'PUBLISHING') {
      throw new Error(
        `The video job cannot be published from status ${job.status}.`
      );
    }

    let publishResult;

    switch (job.targetType) {
      case 'SESSION_VIDEO':
        publishResult = await publishSessionVideo({
          tx,
          job,
          outputKey: normalizedOutputKey,
        });
        break;

      case 'COURSE_INTRO':
        publishResult = await publishCourseIntro({
          tx,
          job,
          outputKey: normalizedOutputKey,
        });
        break;

      default:
        throw new Error(`Unsupported video job target: ${job.targetType}`);
    }

    const readyJob = await tx.videoProcessingJob.update({
      where: {
        id: normalizedJobId,
      },

      data: {
        status: 'READY',
        progress: 100,
        outputKey: normalizedOutputKey,
        errorMessage: null,
        completedAt: new Date(),
      },
    });

    return {
      job: readyJob,
      video: publishResult.video,
      course: publishResult.course,
    };
  });
}
