import prismadb from '@/libs/prismadb';

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

export async function createCourseIntroVideoJob({ courseId, courseTitle }) {
  const normalizedCourseId = normalizeOptionalCourseId(courseId);

  const normalizedCourseTitle = normalizeCourseTitle(courseTitle);

  if (normalizedCourseId) {
    const course = await prismadb.course.findUnique({
      where: {
        id: normalizedCourseId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      throw new Error('Course was not found.');
    }
  }

  return prismadb.videoProcessingJob.create({
    data: {
      targetType: 'COURSE_INTRO',

      courseId: normalizedCourseId,
      courseTitle: normalizedCourseTitle,

      sessionId: null,
      termId: null,

      status: 'UPLOADING',
      uploadProgress: 0,
      progress: 0,
    },
  });
}
