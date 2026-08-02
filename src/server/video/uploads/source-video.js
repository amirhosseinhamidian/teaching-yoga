/* eslint-disable no-undef */
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { access, mkdir, rename, rm } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DEFAULT_UPLOAD_ROOT = './storage/uploads/jobs';
const DEFAULT_MAX_FILE_SIZE = 8 * 1024 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv']);

export class SourceVideoUploadError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'SourceVideoUploadError';
    this.statusCode = statusCode;
  }
}

const normalizeJobId = (jobId) => {
  if (typeof jobId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    throw new SourceVideoUploadError('Invalid job id.');
  }

  return jobId;
};

const getUploadRoot = () =>
  path.resolve(
    process.cwd(),
    process.env.VIDEO_UPLOAD_ROOT || DEFAULT_UPLOAD_ROOT
  );

const getMaxFileSize = () => {
  const value = Number(process.env.MAX_SOURCE_VIDEO_BYTES);

  if (Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  return DEFAULT_MAX_FILE_SIZE;
};

const resolveSafePath = (...segments) => {
  const uploadRoot = getUploadRoot();
  const targetPath = path.resolve(uploadRoot, ...segments);
  const relativePath = path.relative(uploadRoot, targetPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new SourceVideoUploadError('Invalid upload path.');
  }

  return targetPath;
};

const getSourceExtension = (fileName) => {
  const normalizedFileName =
    typeof fileName === 'string'
      ? path.basename(fileName.trim())
      : 'source.mp4';

  const extension = path.extname(normalizedFileName).toLowerCase() || '.mp4';

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new SourceVideoUploadError('Unsupported video file extension.', 415);
  }

  return extension;
};

const fileExists = async (filePath) => {
  try {
    await access(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

class ByteLimitTransform extends Transform {
  constructor(maxBytes) {
    super();
    this.maxBytes = maxBytes;
    this.totalBytes = 0;
  }

  _transform(chunk, encoding, callback) {
    this.totalBytes += chunk.length;

    if (this.totalBytes > this.maxBytes) {
      const error = new SourceVideoUploadError(
        'The uploaded video exceeds the allowed size.',
        413
      );

      callback(error);
      return;
    }

    callback(null, chunk);
  }
}

export const getJobUploadDirectory = (jobId) =>
  resolveSafePath(normalizeJobId(jobId));

export async function saveSourceVideo({
  jobId,
  body,
  fileName,
  contentLength,
  signal,
}) {
  const normalizedJobId = normalizeJobId(jobId);

  if (!body) {
    throw new SourceVideoUploadError('Video request body is required.');
  }

  const maxFileSize = getMaxFileSize();

  if (Number.isFinite(contentLength) && contentLength > maxFileSize) {
    throw new SourceVideoUploadError(
      'The uploaded video exceeds the allowed size.',
      413
    );
  }

  const extension = getSourceExtension(fileName);
  const directory = getJobUploadDirectory(normalizedJobId);
  const finalPath = resolveSafePath(normalizedJobId, `source${extension}`);
  const temporaryPath = `${finalPath}.part`;

  await mkdir(directory, { recursive: true });

  if (await fileExists(finalPath)) {
    throw new SourceVideoUploadError(
      'A source video already exists for this job.',
      409
    );
  }

  await rm(temporaryPath, { force: true });

  const limiter = new ByteLimitTransform(maxFileSize);

  try {
    await pipeline(
      Readable.fromWeb(body),
      limiter,
      createWriteStream(temporaryPath, {
        flags: 'wx',
      }),
      {
        signal,
      }
    );

    if (limiter.totalBytes === 0) {
      throw new SourceVideoUploadError('The uploaded video is empty.');
    }

    await rename(temporaryPath, finalPath);

    return {
      absolutePath: finalPath,
      sourcePath: path.relative(process.cwd(), finalPath).replaceAll('\\', '/'),
      size: limiter.totalBytes,
    };
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

export async function deleteJobUploadDirectory(jobId) {
  const directory = getJobUploadDirectory(jobId);

  await rm(directory, {
    recursive: true,
    force: true,
  });
}
