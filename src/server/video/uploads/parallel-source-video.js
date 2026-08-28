/* eslint-disable no-undef */

import path from 'node:path';
import {
  createReadStream,
  createWriteStream,
} from 'node:fs';

import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';

import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import {
  getJobUploadDirectory,
  SourceVideoUploadError,
  SourceVideoUploadOffsetError,
} from './source-video';

import {
  ensureVideoDiskSpace,
  VideoDiskSpaceError,
} from '../disk-space';

const DEFAULT_MAX_FILE_SIZE =
  8 * 1024 * 1024 * 1024;

const UPLOAD_LOCK_STALE_MS =
  5 * 60 * 1000;

const MANIFEST_LOCK_WAIT_MS = 2000;
const LOCK_RETRY_DELAY_MS = 25;

const MANIFEST_VERSION = 1;

const ALLOWED_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.mkv',
]);

const getMaxFileSize = () => {
  const value = Number(
    process.env.MAX_SOURCE_VIDEO_BYTES
  );

  if (
    Number.isSafeInteger(value) &&
    value > 0
  ) {
    return value;
  }

  return DEFAULT_MAX_FILE_SIZE;
};

const normalizeFileName = (fileName) => {
  const value =
    typeof fileName === 'string'
      ? path.basename(fileName.trim())
      : 'source.mp4';

  return value || 'source.mp4';
};

const getSourceExtension = (fileName) => {
  const extension =
    path
      .extname(
        normalizeFileName(fileName)
      )
      .toLowerCase() || '.mp4';

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new SourceVideoUploadError(
      'Unsupported video file extension.',
      415
    );
  }

  return extension;
};

const validateUploadShape = ({
  totalSize,
  chunkSize,
}) => {
  const maxFileSize = getMaxFileSize();

  if (
    !Number.isSafeInteger(totalSize) ||
    totalSize <= 0
  ) {
    throw new SourceVideoUploadError(
      'Upload length is invalid.'
    );
  }

  if (totalSize > maxFileSize) {
    throw new SourceVideoUploadError(
      'The uploaded video exceeds the allowed size.',
      413
    );
  }

  if (
    !Number.isSafeInteger(chunkSize) ||
    chunkSize <= 0 ||
    chunkSize > maxFileSize
  ) {
    throw new SourceVideoUploadError(
      'Upload chunk size is invalid.'
    );
  }

  return {
    totalSize,
    chunkSize,
    totalChunks: Math.ceil(
      totalSize / chunkSize
    ),
  };
};

const getExpectedChunkSize = ({
  index,
  totalSize,
  chunkSize,
  totalChunks,
}) => {
  if (
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index >= totalChunks
  ) {
    throw new SourceVideoUploadError(
      'Upload chunk index is invalid.'
    );
  }

  const start = index * chunkSize;

  return Math.min(
    chunkSize,
    totalSize - start
  );
};

const getParallelPaths = ({
  jobId,
  fileName,
}) => {
  const jobDirectory =
    getJobUploadDirectory(jobId);

  const extension =
    getSourceExtension(fileName);

  const finalPath = path.join(
    jobDirectory,
    `source${extension}`
  );

  const parallelDirectory = path.join(
    jobDirectory,
    'parallel-source'
  );

  return {
    jobDirectory,
    finalPath,
    parallelDirectory,

    manifestPath: path.join(
      parallelDirectory,
      'manifest.json'
    ),

    manifestLockPath: path.join(
      parallelDirectory,
      'manifest.lock'
    ),

    assembleLockPath: path.join(
      jobDirectory,
      `.source${extension}.assemble.lock`
    ),

    assemblingPath:
      `${finalPath}.assembling`,
  };
};

const getChunkPaths = ({
  parallelDirectory,
  index,
}) => {
  const baseName =
    `chunk-${String(index).padStart(
      6,
      '0'
    )}`;

  return {
    partPath: path.join(
      parallelDirectory,
      `${baseName}.part`
    ),

    donePath: path.join(
      parallelDirectory,
      `${baseName}.done`
    ),

    lockPath: path.join(
      parallelDirectory,
      `${baseName}.lock`
    ),
  };
};

const getExistingFileSize = async (
  filePath
) => {
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

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds
    );
  });

const createLockRelease = ({
  handle,
  lockPath,
}) => async () => {
  await handle
    .close()
    .catch(() => {});

  await rm(lockPath, {
    force: true,
  }).catch(() => {});
};

const acquireLock = async (
  lockPath,
  errorMessage,
  {
    waitForMs = 0,
  } = {}
) => {
  const normalizedWaitForMs =
    Number.isFinite(waitForMs) &&
    waitForMs > 0
      ? waitForMs
      : 0;

  const deadline =
    Date.now() +
    normalizedWaitForMs;

  const tryAcquire = async () =>
    open(lockPath, 'wx');

  while (true) {
    try {
      const handle =
        await tryAcquire();

      return createLockRelease({
        handle,
        lockPath,
      });
    } catch (error) {
      if (
        error?.code !== 'EEXIST'
      ) {
        throw error;
      }

      const lockStat =
        await stat(
          lockPath
        ).catch(() => null);

      if (
        lockStat &&
        Date.now() -
          lockStat.mtimeMs >
          UPLOAD_LOCK_STALE_MS
      ) {
        await rm(lockPath, {
          force: true,
        });

        continue;
      }

      if (
        Date.now() >= deadline
      ) {
        throw new SourceVideoUploadError(
          errorMessage,
          409
        );
      }

      const remainingWait =
        Math.max(
          1,
          deadline - Date.now()
        );

      await sleep(
        Math.min(
          LOCK_RETRY_DELAY_MS,
          remainingWait
        )
      );
    }
  }
};

const readManifest = async (
  manifestPath
) => {
  try {
    const value = await readFile(
      manifestPath,
      'utf8'
    );

    return JSON.parse(value);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }

    if (error instanceof SyntaxError) {
      throw new SourceVideoUploadError(
        'Upload manifest is invalid.',
        409
      );
    }

    throw error;
  }
};

const normalizeFileFingerprint = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const fingerprint =
    String(value)
      .trim()
      .toLowerCase();

  if (
    !/^sha256:[a-f0-9]{64}$/.test(
      fingerprint
    )
  ) {
    throw new SourceVideoUploadError(
      'Upload file fingerprint is invalid.'
    );
  }

  return fingerprint;
};

const assertManifestMatches = ({
  manifest,
  fileName,
  totalSize,
  chunkSize,
  fileFingerprint = null,
}) => {
  const normalizedFingerprint =
    normalizeFileFingerprint(
      fileFingerprint
    );

  if (
    manifest?.version !==
      MANIFEST_VERSION ||
    manifest?.fileName !==
      normalizeFileName(fileName) ||
    manifest?.totalSize !==
      totalSize ||
    manifest?.chunkSize !==
      chunkSize ||
    (
      normalizedFingerprint &&
      manifest?.fileFingerprint &&
      manifest.fileFingerprint !==
        normalizedFingerprint
    )
  ) {
    throw new SourceVideoUploadError(
      'Selected file does not match the existing resumable upload.',
      409
    );
  }
};

const ensureManifest = async ({
  jobId,
  fileName,
  totalSize,
  chunkSize,
  fileFingerprint = null,
}) => {
  const shape =
    validateUploadShape({
      totalSize,
      chunkSize,
    });

  const paths =
    getParallelPaths({
      jobId,
      fileName,
    });

  await mkdir(
    paths.parallelDirectory,
    {
      recursive: true,
    }
  );

  const normalizedFingerprint =
    normalizeFileFingerprint(
      fileFingerprint
    );

  const manifest = {
    version: MANIFEST_VERSION,

    fileName:
      normalizeFileName(fileName),

    totalSize: shape.totalSize,
    chunkSize: shape.chunkSize,
    totalChunks: shape.totalChunks,

    ...(normalizedFingerprint
      ? {
          fileFingerprint:
            normalizedFingerprint,
        }
      : {}),
  };

  const currentManifest =
    await readManifest(
      paths.manifestPath
    );

  if (currentManifest) {
    assertManifestMatches({
      manifest: currentManifest,
      fileName,
      totalSize,
      chunkSize,
      fileFingerprint:
        normalizedFingerprint,
    });

    /*
     * Manifestهای ساخته‌شده قبل از این نسخه fingerprint
     * ندارند. اولین status جدید همان manifest را ارتقا
     * می‌دهد؛ بنابراین Resumeهای موجود خراب نمی‌شوند.
     */
    if (
      !normalizedFingerprint ||
      currentManifest.fileFingerprint
    ) {
      return {
        manifest: currentManifest,
        paths,
      };
    }
  }

  const releaseManifestLock =
    await acquireLock(
      paths.manifestLockPath,
      'Upload manifest is currently being initialized.',
      {
        /*
         * دو chunk اول ممکن است هم‌زمان برسند.
         * فقط قفل initialization منتظر می‌ماند؛
         * قفل خود chunkها همچنان fail-fast است.
         */
        waitForMs:
          MANIFEST_LOCK_WAIT_MS,
      }
    );

  try {
    const existingManifest =
      await readManifest(
        paths.manifestPath
      );

    if (existingManifest) {
      assertManifestMatches({
        manifest:
          existingManifest,
        fileName,
        totalSize,
        chunkSize,
        fileFingerprint:
          normalizedFingerprint,
      });

      if (
        normalizedFingerprint &&
        !existingManifest.fileFingerprint
      ) {
        const upgradedManifest = {
          ...existingManifest,

          fileFingerprint:
            normalizedFingerprint,
        };

        await writeFile(
          paths.manifestPath,
          JSON.stringify(
            upgradedManifest,
            null,
            2
          ),
          {
            encoding: 'utf8',
          }
        );

        return {
          manifest:
            upgradedManifest,
          paths,
        };
      }

      return {
        manifest:
          existingManifest,
        paths,
      };
    }

    await writeFile(
      paths.manifestPath,
      JSON.stringify(
        manifest,
        null,
        2
      ),
      {
        encoding: 'utf8',
      }
    );

    return {
      manifest,
      paths,
    };
  } finally {
    await releaseManifestLock();
  }
};

const getChunkInventory = async ({
  parallelDirectory,
  manifest,
}) => {
  const entries = await readdir(
    parallelDirectory,
    {
      withFileTypes: true,
    }
  ).catch((error) => {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  });

  const candidates = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const match =
      /^chunk-(\d{6})\.(part|done)$/.exec(
        entry.name
      );

    if (!match) {
      continue;
    }

    const index = Number(match[1]);

    if (
      !Number.isSafeInteger(index) ||
      index < 0 ||
      index >= manifest.totalChunks
    ) {
      continue;
    }

    const type = match[2];

    const previous =
      candidates.get(index);

    if (
      previous?.type === 'done' &&
      type !== 'done'
    ) {
      continue;
    }

    candidates.set(index, {
      type,

      filePath: path.join(
        parallelDirectory,
        entry.name
      ),
    });
  }

  const sizes = new Map();

  await Promise.all(
    [...candidates.entries()].map(
      async ([index, item]) => {
        const fileSize =
          await getExistingFileSize(
            item.filePath
          );

        if (fileSize === null) {
          return;
        }

        sizes.set(index, {
          type: item.type,
          size: fileSize,
          filePath: item.filePath,
        });
      }
    )
  );

  return sizes;
};

const buildUploadStatus = async ({
  paths,
  manifest,
}) => {
  const finalSize =
    await getExistingFileSize(
      paths.finalPath
    );

  if (finalSize !== null) {
    if (
      finalSize !==
      manifest.totalSize
    ) {
      throw new SourceVideoUploadError(
        'Saved source size does not match the selected file.',
        409
      );
    }

    return {
      uploadedBytes: finalSize,
      totalSize: manifest.totalSize,

      chunkSize: manifest.chunkSize,
      totalChunks: manifest.totalChunks,
      completedChunks:
        manifest.totalChunks,

      chunks: [],

      complete: true,
      finalized: true,
    };
  }

  const inventory =
    await getChunkInventory({
      parallelDirectory:
        paths.parallelDirectory,
      manifest,
    });

  let uploadedBytes = 0;
  let completedChunks = 0;

  const chunks = [];

  for (
    let index = 0;
    index < manifest.totalChunks;
    index += 1
  ) {
    const expectedSize =
      getExpectedChunkSize({
        index,

        totalSize:
          manifest.totalSize,

        chunkSize:
          manifest.chunkSize,

        totalChunks:
          manifest.totalChunks,
      });

    const existing =
      inventory.get(index);

    const chunkBytes =
      existing?.size || 0;

    if (
      chunkBytes < 0 ||
      chunkBytes > expectedSize
    ) {
      throw new SourceVideoUploadError(
        `Saved chunk ${index} has an invalid size.`,
        409
      );
    }

    const complete =
      chunkBytes === expectedSize;

    if (complete) {
      completedChunks += 1;
    }

    uploadedBytes += chunkBytes;

    chunks.push({
      index,
      uploadedBytes: chunkBytes,
      size: expectedSize,
      complete,
    });
  }

  return {
    uploadedBytes,
    totalSize: manifest.totalSize,

    chunkSize: manifest.chunkSize,
    totalChunks: manifest.totalChunks,
    completedChunks,

    chunks,

    complete:
      completedChunks ===
      manifest.totalChunks,

    finalized: false,
  };
};

class ChunkByteLimitTransform
  extends Transform {
  constructor(maxBytes) {
    super();

    this.maxBytes = maxBytes;
    this.totalBytes = 0;
  }

  _transform(
    chunk,
    encoding,
    callback
  ) {
    this.totalBytes +=
      chunk.length;

    if (
      this.totalBytes >
      this.maxBytes
    ) {
      callback(
        new SourceVideoUploadError(
          'Chunk size exceeds the remaining chunk size.',
          413
        )
      );

      return;
    }

    callback(null, chunk);
  }
}

export async function getParallelSourceVideoUploadStatus({
  jobId,
  fileName,
  totalSize,
  chunkSize,
  fileFingerprint = null,
}) {
  const shape =
    validateUploadShape({
      totalSize,
      chunkSize,
    });

  const paths =
    getParallelPaths({
      jobId,
      fileName,
    });

  const finalSize =
    await getExistingFileSize(
      paths.finalPath
    );

  if (finalSize !== null) {
    if (
      finalSize !==
      shape.totalSize
    ) {
      throw new SourceVideoUploadError(
        'Saved source size does not match the selected file.',
        409
      );
    }

    return {
      uploadedBytes: finalSize,
      totalSize: shape.totalSize,

      chunkSize: shape.chunkSize,
      totalChunks: shape.totalChunks,
      completedChunks:
        shape.totalChunks,

      chunks: [],

      complete: true,
      finalized: true,
    };
  }

  const {
    manifest,
    paths: manifestPaths,
  } = await ensureManifest({
    jobId,
    fileName,
    totalSize,
    chunkSize,
    fileFingerprint,
  });

  return buildUploadStatus({
    paths: manifestPaths,
    manifest,
  });
}

export async function saveParallelSourceVideoChunk({
  jobId,
  body,
  fileName,
  contentLength,
  uploadOffset,
  totalSize,
  chunkSize,
  chunkIndex,
  signal,
}) {
  if (
    !Number.isSafeInteger(
      uploadOffset
    ) ||
    uploadOffset < 0
  ) {
    throw new SourceVideoUploadError(
      'Upload offset is invalid.'
    );
  }

  const {
    manifest,
    paths,
  } = await ensureManifest({
    jobId,
    fileName,
    totalSize,
    chunkSize,
  });

  const expectedChunkSize =
    getExpectedChunkSize({
      index: chunkIndex,

      totalSize:
        manifest.totalSize,

      chunkSize:
        manifest.chunkSize,

      totalChunks:
        manifest.totalChunks,
    });

  const chunkStart =
    chunkIndex *
    manifest.chunkSize;

  const chunkEnd =
    chunkStart +
    expectedChunkSize;

  if (
    uploadOffset < chunkStart ||
    uploadOffset > chunkEnd
  ) {
    throw new SourceVideoUploadError(
      'Upload offset is outside the selected chunk.',
      409
    );
  }

  const chunkPaths =
    getChunkPaths({
      parallelDirectory:
        paths.parallelDirectory,

      index: chunkIndex,
    });

  const releaseLock =
    await acquireLock(
      chunkPaths.lockPath,
      'Another request is currently writing this upload chunk.'
    );

  try {
    const doneSize =
      await getExistingFileSize(
        chunkPaths.donePath
      );

    if (doneSize !== null) {
      if (
        doneSize !==
        expectedChunkSize
      ) {
        throw new SourceVideoUploadError(
          `Saved chunk ${chunkIndex} has an invalid size.`,
          409
        );
      }

      const upload =
        await buildUploadStatus({
          paths,
          manifest,
        });

      return {
        ...upload,

        chunk: {
          index: chunkIndex,
          uploadedBytes:
            expectedChunkSize,
          size: expectedChunkSize,
          complete: true,
        },
      };
    }

    const currentSize =
      (await getExistingFileSize(
        chunkPaths.partPath
      )) || 0;

    const expectedOffset =
      chunkStart + currentSize;

    if (
      uploadOffset !==
      expectedOffset
    ) {
      throw new SourceVideoUploadOffsetError({
        expectedOffset,
        receivedOffset:
          uploadOffset,
      });
    }

    if (
      currentSize ===
      expectedChunkSize
    ) {
      await rename(
        chunkPaths.partPath,
        chunkPaths.donePath
      );

      const upload =
        await buildUploadStatus({
          paths,
          manifest,
        });

      return {
        ...upload,

        chunk: {
          index: chunkIndex,
          uploadedBytes:
            expectedChunkSize,
          size: expectedChunkSize,
          complete: true,
        },
      };
    }

    if (!body) {
      throw new SourceVideoUploadError(
        'Video chunk request body is required.'
      );
    }

    const remainingBytes =
      expectedChunkSize -
      currentSize;

    if (
      Number.isFinite(
        contentLength
      ) &&
      (
        contentLength <= 0 ||
        contentLength >
          remainingBytes
      )
    ) {
      throw new SourceVideoUploadError(
        'Chunk request size exceeds the remaining chunk size.',
        400
      );
    }

    const limiter =
      new ChunkByteLimitTransform(
        remainingBytes
      );

    await pipeline(
      Readable.fromWeb(body),

      limiter,

      createWriteStream(
        chunkPaths.partPath,
        {
          flags: 'a',
        }
      ),

      {
        signal,
      }
    );

    if (
      limiter.totalBytes === 0
    ) {
      throw new SourceVideoUploadError(
        'The uploaded chunk is empty.'
      );
    }

    const savedSize =
      await getExistingFileSize(
        chunkPaths.partPath
      );

    if (
      savedSize === null ||
      savedSize >
        expectedChunkSize
    ) {
      throw new SourceVideoUploadError(
        `Saved chunk ${chunkIndex} has an invalid size.`,
        409
      );
    }

    const chunkComplete =
      savedSize ===
      expectedChunkSize;

    if (chunkComplete) {
      await rename(
        chunkPaths.partPath,
        chunkPaths.donePath
      );
    }

    const upload =
      await buildUploadStatus({
        paths,
        manifest,
      });

    return {
      ...upload,

      chunk: {
        index: chunkIndex,
        uploadedBytes: savedSize,
        size: expectedChunkSize,
        complete: chunkComplete,
      },
    };
  } finally {
    await releaseLock();
  }
}

const getCompleteChunkPath = async ({
  parallelDirectory,
  manifest,
  index,
}) => {
  const paths =
    getChunkPaths({
      parallelDirectory,
      index,
    });

  const expectedSize =
    getExpectedChunkSize({
      index,

      totalSize:
        manifest.totalSize,

      chunkSize:
        manifest.chunkSize,

      totalChunks:
        manifest.totalChunks,
    });

  const doneSize =
    await getExistingFileSize(
      paths.donePath
    );

  if (
    doneSize === expectedSize
  ) {
    return paths.donePath;
  }

  const partSize =
    await getExistingFileSize(
      paths.partPath
    );

  if (
    partSize === expectedSize
  ) {
    return paths.partPath;
  }

  throw new SourceVideoUploadError(
    `Upload chunk ${index} is incomplete.`,
    409
  );
};

export async function finalizeParallelSourceVideo({
  jobId,
  fileName,
  totalSize,
  chunkSize,
  fileFingerprint = null,
}) {
  const shape =
    validateUploadShape({
      totalSize,
      chunkSize,
    });

  const initialPaths =
    getParallelPaths({
      jobId,
      fileName,
    });

  const existingFinalSize =
    await getExistingFileSize(
      initialPaths.finalPath
    );

  if (
    existingFinalSize !== null
  ) {
    if (
      existingFinalSize !==
      shape.totalSize
    ) {
      throw new SourceVideoUploadError(
        'Saved source size does not match the selected file.',
        409
      );
    }

    await rm(
      initialPaths.parallelDirectory,
      {
        recursive: true,
        force: true,
      }
    ).catch(() => {});

    return {
      absolutePath:
        initialPaths.finalPath,

      sourcePath: path
        .relative(
          process.cwd(),
          initialPaths.finalPath
        )
        .replaceAll('\\', '/'),

      size: existingFinalSize,
      uploadedBytes:
        existingFinalSize,
      totalSize: shape.totalSize,
      complete: true,
      finalized: true,
    };
  }

  const {
    manifest,
    paths,
  } = await ensureManifest({
    jobId,
    fileName,
    totalSize,
    chunkSize,
    fileFingerprint,
  });

  const upload =
    await buildUploadStatus({
      paths,
      manifest,
    });

  if (!upload.complete) {
    throw new SourceVideoUploadError(
      'All upload chunks must be completed before finalization.',
      409
    );
  }

  const releaseLock =
    await acquireLock(
      paths.assembleLockPath,
      'Video source assembly is already running.'
    );

  try {
    const finalSize =
      await getExistingFileSize(
        paths.finalPath
      );

    if (
      finalSize !== null
    ) {
      if (
        finalSize !==
        manifest.totalSize
      ) {
        throw new SourceVideoUploadError(
          'Saved source size does not match the selected file.',
          409
        );
      }

      return {
        absolutePath:
          paths.finalPath,

        sourcePath: path
          .relative(
            process.cwd(),
            paths.finalPath
          )
          .replaceAll('\\', '/'),

        size: finalSize,
        uploadedBytes: finalSize,
        totalSize:
          manifest.totalSize,
        complete: true,
        finalized: true,
      };
    }

    try {
      await ensureVideoDiskSpace({
        targetPath:
          paths.jobDirectory,

        /*
         * chunkها همین حالا روی دیسک هستند و assemble
         * یک کپی کامل دیگر می‌سازد؛ بنابراین تقریباً
         * به اندازه کل فایل فضای اضافه لازم داریم.
         */
        requiredBytes:
          manifest.totalSize,

        operation:
          'نهایی‌سازی فایل ویدئو',
      });
    } catch (error) {
      if (
        error instanceof
        VideoDiskSpaceError
      ) {
        throw new SourceVideoUploadError(
          error.message,
          error.statusCode
        );
      }

      throw error;
    }

    await rm(
      paths.assemblingPath,
      {
        force: true,
      }
    );

    try {
      for (
        let index = 0;
        index <
        manifest.totalChunks;
        index += 1
      ) {
        const chunkPath =
          await getCompleteChunkPath({
            parallelDirectory:
              paths.parallelDirectory,

            manifest,
            index,
          });

        await pipeline(
          createReadStream(
            chunkPath
          ),

          createWriteStream(
            paths.assemblingPath,
            {
              flags:
                index === 0
                  ? 'wx'
                  : 'a',
            }
          )
        );
      }

      const assembledStat =
        await stat(
          paths.assemblingPath
        );

      if (
        assembledStat.size !==
        manifest.totalSize
      ) {
        throw new SourceVideoUploadError(
          'Assembled source size does not match the selected file.',
          409
        );
      }

      await rename(
        paths.assemblingPath,
        paths.finalPath
      );
    } catch (error) {
      await rm(
        paths.assemblingPath,
        {
          force: true,
        }
      ).catch(() => {});

      throw error;
    }

    await rm(
      paths.parallelDirectory,
      {
        recursive: true,
        force: true,
      }
    );

    return {
      absolutePath:
        paths.finalPath,

      sourcePath: path
        .relative(
          process.cwd(),
          paths.finalPath
        )
        .replaceAll('\\', '/'),

      size: manifest.totalSize,
      uploadedBytes:
        manifest.totalSize,
      totalSize:
        manifest.totalSize,
      complete: true,
      finalized: true,
    };
  } finally {
    await releaseLock();
  }
}
