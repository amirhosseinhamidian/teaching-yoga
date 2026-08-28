/* eslint-disable no-undef */
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { access, mkdir, open, rename, rm, stat } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DEFAULT_UPLOAD_ROOT = './storage/uploads/jobs';
const DEFAULT_MAX_FILE_SIZE = 8 * 1024 * 1024 * 1024;
const UPLOAD_LOCK_STALE_MS = 5 * 60 * 1000;

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv']);

export class SourceVideoUploadError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'SourceVideoUploadError';
    this.statusCode = statusCode;
  }
}

export class SourceVideoUploadOffsetError extends SourceVideoUploadError {
  constructor({ expectedOffset, receivedOffset }) {
    super('Upload offset does not match the saved source size.', 409);

    this.name = 'SourceVideoUploadOffsetError';
    this.expectedOffset = expectedOffset;
    this.receivedOffset = receivedOffset;
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

const getExistingFileSize = async (filePath) => {
  try {
    const fileStat = await stat(filePath);

    return fileStat.size;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
};

const getSourcePaths = ({ jobId, fileName }) => {
  const normalizedJobId = normalizeJobId(jobId);
  const extension = getSourceExtension(fileName);

  const directory = getJobUploadDirectory(normalizedJobId);
  const finalPath = resolveSafePath(normalizedJobId, `source${extension}`);

  return {
    normalizedJobId,
    directory,
    finalPath,
    temporaryPath: `${finalPath}.part`,
    lockPath: `${finalPath}.part.lock`,
  };
};

const acquireUploadLock = async (lockPath) => {
  const tryAcquire = async () => open(lockPath, 'wx');

  try {
    const handle = await tryAcquire();

    return async () => {
      await handle.close().catch(() => {});
      await rm(lockPath, { force: true }).catch(() => {});
    };
  } catch (error) {
    if (error?.code !== 'EEXIST') {
      throw error;
    }

    const lockStat = await stat(lockPath).catch(() => null);

    if (
      lockStat &&
      Date.now() - lockStat.mtimeMs > UPLOAD_LOCK_STALE_MS
    ) {
      await rm(lockPath, { force: true });

      const handle = await tryAcquire();

      return async () => {
        await handle.close().catch(() => {});
        await rm(lockPath, { force: true }).catch(() => {});
      };
    }

    throw new SourceVideoUploadError(
      'Another upload chunk is currently being written.',
      409
    );
  }
};

const validateTotalSize = (totalSize) => {
  const maxFileSize = getMaxFileSize();

  if (!Number.isSafeInteger(totalSize) || totalSize <= 0) {
    throw new SourceVideoUploadError('Upload length is invalid.');
  }

  if (totalSize > maxFileSize) {
    throw new SourceVideoUploadError(
      'The uploaded video exceeds the allowed size.',
      413
    );
  }

  return totalSize;
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

export async function getSourceVideoUploadStatus({
  jobId,
  fileName,
  totalSize,
}) {
  const normalizedTotalSize = validateTotalSize(totalSize);

  const {
    finalPath,
    temporaryPath,
  } = getSourcePaths({
    jobId,
    fileName,
  });

  const finalSize = await getExistingFileSize(finalPath);

  if (finalSize !== null) {
    if (finalSize !== normalizedTotalSize) {
      throw new SourceVideoUploadError(
        'Saved source size does not match the selected file.',
        409
      );
    }

    return {
      uploadedBytes: finalSize,
      totalSize: normalizedTotalSize,
      complete: true,
    };
  }

  const uploadedBytes =
    (await getExistingFileSize(temporaryPath)) || 0;

  if (uploadedBytes > normalizedTotalSize) {
    throw new SourceVideoUploadError(
      'Saved upload state is larger than the selected file.',
      409
    );
  }

  return {
    uploadedBytes,
    totalSize: normalizedTotalSize,
    complete: uploadedBytes === normalizedTotalSize,
  };
}

export async function appendSourceVideoChunk({
  jobId,
  body,
  fileName,
  contentLength,
  uploadOffset,
  totalSize,
  signal,
}) {
  if (!body) {
    throw new SourceVideoUploadError('Video request body is required.');
  }

  if (!Number.isSafeInteger(uploadOffset) || uploadOffset < 0) {
    throw new SourceVideoUploadError('Upload offset is invalid.');
  }

  const normalizedTotalSize = validateTotalSize(totalSize);

  if (uploadOffset > normalizedTotalSize) {
    throw new SourceVideoUploadError(
      'Upload offset exceeds the selected file size.',
      409
    );
  }

  const {
    directory,
    finalPath,
    temporaryPath,
    lockPath,
  } = getSourcePaths({
    jobId,
    fileName,
  });

  await mkdir(directory, { recursive: true });

  const releaseLock = await acquireUploadLock(lockPath);

  try {
    const finalSize = await getExistingFileSize(finalPath);

    if (finalSize !== null) {
      if (finalSize !== normalizedTotalSize) {
        throw new SourceVideoUploadError(
          'A different source video already exists for this job.',
          409
        );
      }

      return {
        absolutePath: finalPath,
        sourcePath: path
          .relative(process.cwd(), finalPath)
          .replaceAll('\\', '/'),
        size: finalSize,
        uploadedBytes: finalSize,
        totalSize: normalizedTotalSize,
        complete: true,
      };
    }

    const currentSize =
      (await getExistingFileSize(temporaryPath)) || 0;

    if (currentSize !== uploadOffset) {
      throw new SourceVideoUploadOffsetError({
        expectedOffset: currentSize,
        receivedOffset: uploadOffset,
      });
    }

    if (currentSize === normalizedTotalSize) {
      await rename(temporaryPath, finalPath);

      return {
        absolutePath: finalPath,
        sourcePath: path
          .relative(process.cwd(), finalPath)
          .replaceAll('\\', '/'),
        size: currentSize,
        uploadedBytes: currentSize,
        totalSize: normalizedTotalSize,
        complete: true,
      };
    }

    const remainingBytes =
      normalizedTotalSize - currentSize;

    if (
      Number.isFinite(contentLength) &&
      (contentLength <= 0 || contentLength > remainingBytes)
    ) {
      throw new SourceVideoUploadError(
        'Chunk size exceeds the remaining upload size.',
        400
      );
    }

    const limiter = new ByteLimitTransform(remainingBytes);

    await pipeline(
      Readable.fromWeb(body),
      limiter,
      createWriteStream(temporaryPath, {
        flags: 'a',
      }),
      {
        signal,
      }
    );

    if (limiter.totalBytes === 0) {
      throw new SourceVideoUploadError('The uploaded chunk is empty.');
    }

    const uploadedBytes =
      currentSize + limiter.totalBytes;

    const complete =
      uploadedBytes === normalizedTotalSize;

    if (complete) {
      await rename(temporaryPath, finalPath);
    }

    return {
      absolutePath: complete ? finalPath : temporaryPath,
      sourcePath: complete
        ? path
            .relative(process.cwd(), finalPath)
            .replaceAll('\\', '/')
        : null,
      size: uploadedBytes,
      uploadedBytes,
      totalSize: normalizedTotalSize,
      complete,
    };
  } finally {
    await releaseLock();
  }
}

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
