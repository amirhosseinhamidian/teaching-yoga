import path from 'node:path';

import {
  stat,
} from 'node:fs/promises';

import {
  getJobUploadDirectory,
} from '../uploads/source-video';

export class VideoJobRetrySourceError extends Error {
  constructor(message) {
    super(message);

    this.name =
      'VideoJobRetrySourceError';

    this.statusCode = 409;
  }
}

const isPathInside = (
  parentPath,
  childPath
) => {
  const relativePath =
    path.relative(
      parentPath,
      childPath
    );

  return Boolean(
    relativePath &&
    !relativePath.startsWith('..') &&
    !path.isAbsolute(relativePath)
  );
};

export async function assertRetryableVideoSource({
  jobId,
  sourcePath,
}) {
  const normalizedSourcePath =
    typeof sourcePath === 'string'
      ? sourcePath.trim()
      : '';

  if (!normalizedSourcePath) {
    throw new VideoJobRetrySourceError(
      'فایل اصلی این ویدئو دیگر روی سرور موجود نیست و باید دوباره آپلود شود.'
    );
  }

  const uploadDirectory =
    getJobUploadDirectory(jobId);

  const absoluteSourcePath =
    path.resolve(
      process.cwd(),
      normalizedSourcePath
    );

  if (
    !isPathInside(
      uploadDirectory,
      absoluteSourcePath
    )
  ) {
    throw new VideoJobRetrySourceError(
      'مسیر فایل اصلی ویدئو معتبر نیست.'
    );
  }

  let sourceStat;

  try {
    sourceStat =
      await stat(
        absoluteSourcePath
      );
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new VideoJobRetrySourceError(
        'فایل اصلی این ویدئو دیگر روی سرور موجود نیست و باید دوباره آپلود شود.'
      );
    }

    throw error;
  }

  if (
    !sourceStat.isFile() ||
    sourceStat.size <= 0
  ) {
    throw new VideoJobRetrySourceError(
      'فایل اصلی این ویدئو برای پردازش مجدد معتبر نیست.'
    );
  }

  return {
    absolutePath:
      absoluteSourcePath,

    size:
      sourceStat.size,
  };
}
