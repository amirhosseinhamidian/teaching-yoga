/* eslint-disable no-constant-condition */
const TERMINAL_STATUSES = ['READY', 'FAILED', 'CANCELLED'];

const DEFAULT_UPLOAD_CHUNK_SIZE_BYTES =
  16 * 1024 * 1024;

const MIN_UPLOAD_CHUNK_SIZE_MIB = 4;
const MAX_UPLOAD_CHUNK_SIZE_MIB = 64;

const DEFAULT_MAX_UPLOAD_CHUNK_RETRIES = 3;

const DEFAULT_UPLOAD_CONCURRENCY = 2;
const MAX_UPLOAD_CONCURRENCY = 3;

const getConfiguredUploadChunkSizeBytes = () => {
  const configuredMiB = Number(
    process.env.NEXT_PUBLIC_VIDEO_UPLOAD_CHUNK_SIZE_MB
  );

  if (
    Number.isInteger(configuredMiB) &&
    configuredMiB >= MIN_UPLOAD_CHUNK_SIZE_MIB &&
    configuredMiB <= MAX_UPLOAD_CHUNK_SIZE_MIB
  ) {
    return configuredMiB * 1024 * 1024;
  }

  return DEFAULT_UPLOAD_CHUNK_SIZE_BYTES;
};

const getConfiguredUploadChunkRetries = () => {
  const configuredRetries = Number(
    process.env.NEXT_PUBLIC_VIDEO_UPLOAD_CHUNK_RETRIES
  );

  if (
    Number.isInteger(configuredRetries) &&
    configuredRetries >= 0 &&
    configuredRetries <= 6
  ) {
    return configuredRetries;
  }

  return DEFAULT_MAX_UPLOAD_CHUNK_RETRIES;
};

const getConfiguredUploadConcurrency = () => {
  const configuredConcurrency = Number(
    process.env.NEXT_PUBLIC_VIDEO_UPLOAD_CONCURRENCY
  );

  if (
    Number.isInteger(configuredConcurrency) &&
    configuredConcurrency >= 1 &&
    configuredConcurrency <= MAX_UPLOAD_CONCURRENCY
  ) {
    return configuredConcurrency;
  }

  return DEFAULT_UPLOAD_CONCURRENCY;
};

const createAbortError = () => {
  const error = new Error('Operation was cancelled.');
  error.name = 'AbortError';

  return error;
};

const readJsonResponse = async (response) => {
  const text = await response.text();

  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `پاسخ نامعتبر از سرور دریافت شد. HTTP ${response.status}`
      );
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || `درخواست با خطای HTTP ${response.status} مواجه شد.`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
};

const sleep = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, milliseconds);

    const handleAbort = () => {
      clearTimeout(timeout);
      cleanup();
      reject(createAbortError());
    };

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
    };

    signal?.addEventListener('abort', handleAbort, {
      once: true,
    });
  });

export async function createAdminVideoJob({
  sessionId,
  termId,
  accessLevel,
  signal,
}) {
  const response = await fetch('/api/admin/video-jobs', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      sessionId,
      termId,
      accessLevel,
    }),

    signal,
  });

  const data = await readJsonResponse(response);

  return data.job;
}

const isRetryableUploadError = (error) => {
  if (error?.name === 'AbortError') {
    return false;
  }

  const status = Number(error?.status);

  if (!Number.isFinite(status) || status <= 0) {
    return true;
  }

  /*
   * 507 یعنی سرور عمداً به‌خاطر فضای دیسک کم
   * درخواست را متوقف کرده است. Retry فوری کمکی
   * نمی‌کند و فقط بار اضافه می‌سازد.
   */
  if (status === 507) {
    return false;
  }

  return (
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  );
};

const SUPPORTED_VIDEO_UPLOAD_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'application/octet-stream',
]);

const getVideoUploadContentType = (file) => {
  const contentType =
    typeof file?.type === 'string'
      ? file.type.trim().toLowerCase()
      : '';

  return SUPPORTED_VIDEO_UPLOAD_CONTENT_TYPES.has(
    contentType
  )
    ? contentType
    : 'application/octet-stream';
};

const PARALLEL_UPLOAD_MODE =
  'parallel-chunked';

const FILE_FINGERPRINT_SAMPLE_BYTES =
  256 * 1024;

const fileFingerprintCache =
  new WeakMap();

const createVideoFileFingerprint =
  async ({
    file,
    signal,
  }) => {
    if (
      !(file instanceof File) ||
      file.size <= 0
    ) {
      throw new Error(
        'فایل ویدئویی معتبر نیست.'
      );
    }

    const cached =
      fileFingerprintCache.get(file);

    if (cached) {
      return cached;
    }

    const promise = (async () => {
      if (signal?.aborted) {
        throw createAbortError();
      }

      if (
        !globalThis.crypto?.subtle
      ) {
        throw new Error(
          'مرورگر امکان ساخت اثرانگشت فایل را ندارد.'
        );
      }

      const sampleSize =
        Math.min(
          FILE_FINGERPRINT_SAMPLE_BYTES,
          file.size
        );

      const tailStart =
        Math.max(
          0,
          file.size - sampleSize
        );

      const [
        firstBuffer,
        lastBuffer,
      ] = await Promise.all([
        file
          .slice(0, sampleSize)
          .arrayBuffer(),

        file
          .slice(
            tailStart,
            file.size
          )
          .arrayBuffer(),
      ]);

      if (signal?.aborted) {
        throw createAbortError();
      }

      const metadata =
        new TextEncoder().encode(
          `video-upload-fingerprint-v1:${file.size}:`
        );

      const first =
        new Uint8Array(firstBuffer);

      const last =
        new Uint8Array(lastBuffer);

      const payload =
        new Uint8Array(
          metadata.length +
            first.length +
            last.length
        );

      payload.set(
        metadata,
        0
      );

      payload.set(
        first,
        metadata.length
      );

      payload.set(
        last,
        metadata.length +
          first.length
      );

      const digest =
        await globalThis.crypto.subtle.digest(
          'SHA-256',
          payload
        );

      if (signal?.aborted) {
        throw createAbortError();
      }

      const hex = [
        ...new Uint8Array(digest),
      ]
        .map((byte) =>
          byte
            .toString(16)
            .padStart(2, '0')
        )
        .join('');

      return `sha256:${hex}`;
    })();

    fileFingerprintCache.set(
      file,
      promise
    );

    try {
      return await promise;
    } catch (error) {
      fileFingerprintCache.delete(
        file
      );

      throw error;
    }
  };

const getParallelUploadHeaders = ({
  file,
  chunkSizeBytes,
  fileFingerprint = null,
}) => ({
  'X-File-Name': encodeURIComponent(
    file.name || 'source.mp4'
  ),

  'X-Upload-Mode':
    PARALLEL_UPLOAD_MODE,

  'X-Upload-Length':
    String(file.size),

  'X-Upload-Chunk-Size':
    String(chunkSizeBytes),

  ...(fileFingerprint
    ? {
        'X-Upload-Fingerprint':
          fileFingerprint,
      }
    : {}),
});

export async function getAdminVideoSourceUploadStatus({
  jobId,
  file,
  signal,
  chunkSizeBytes =
    getConfiguredUploadChunkSizeBytes(),
}) {
  if (
    !(file instanceof File) ||
    file.size <= 0
  ) {
    throw new Error(
      'فایل ویدئویی معتبر نیست.'
    );
  }

  const fileFingerprint =
    await createVideoFileFingerprint({
      file,
      signal,
    });

  const response = await fetch(
    `/api/admin/video-jobs/${encodeURIComponent(jobId)}/source`,
    {
      method: 'GET',
      cache: 'no-store',

      headers: getParallelUploadHeaders({
        file,
        chunkSizeBytes,
        fileFingerprint,
      }),

      signal,
    }
  );

  return readJsonResponse(response);
}

const finalizeAdminVideoSourceUpload =
  async ({
    jobId,
    file,
    signal,
    chunkSizeBytes,
  }) => {
    const fileFingerprint =
      await createVideoFileFingerprint({
        file,
        signal,
      });

    const response = await fetch(
      `/api/admin/video-jobs/${encodeURIComponent(jobId)}/source`,
      {
        method: 'POST',

        headers:
          getParallelUploadHeaders({
            file,
            chunkSizeBytes,
            fileFingerprint,
          }),

        signal,
      }
    );

    return readJsonResponse(response);
  };

const uploadAdminVideoChunk = ({
  jobId,
  file,
  chunk,
  uploadOffset,
  chunkIndex,
  chunkSizeBytes,
  signal,
  onChunkProgress,
}) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const xhr =
      new XMLHttpRequest();

    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener(
        'abort',
        handleSignalAbort
      );
    };

    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const handleSignalAbort = () => {
      xhr.abort();
    };

    xhr.open(
      'PUT',
      `/api/admin/video-jobs/${encodeURIComponent(jobId)}/source`
    );

    xhr.setRequestHeader(
      'Content-Type',
      getVideoUploadContentType(file)
    );

    const commonHeaders =
      getParallelUploadHeaders({
        file,
        chunkSizeBytes,
      });

    Object.entries(
      commonHeaders
    ).forEach(([name, value]) => {
      xhr.setRequestHeader(
        name,
        value
      );
    });

    xhr.setRequestHeader(
      'X-Upload-Offset',
      String(uploadOffset)
    );

    xhr.setRequestHeader(
      'X-Upload-Chunk-Index',
      String(chunkIndex)
    );

    xhr.upload.addEventListener(
      'progress',
      (event) => {
        onChunkProgress?.(
          event.loaded
        );
      }
    );

    xhr.addEventListener(
      'load',
      () => {
        finish(() => {
          let data = {};

          try {
            data =
              xhr.responseText
                ? JSON.parse(
                    xhr.responseText
                  )
                : {};
          } catch {
            reject(
              new Error(
                'پاسخ نامعتبر از API آپلود دریافت شد.'
              )
            );

            return;
          }

          if (
            xhr.status < 200 ||
            xhr.status >= 300
          ) {
            const error =
              new Error(
                data?.error ||
                  `آپلود با خطای HTTP ${xhr.status} مواجه شد.`
              );

            error.status =
              xhr.status;

            error.data = data;

            reject(error);
            return;
          }

          resolve(data);
        });
      }
    );

    xhr.addEventListener(
      'error',
      () => {
        finish(() => {
          const error =
            new Error(
              'ارتباط با سرور هنگام آپلود قطع شد.'
            );

          error.status = 0;

          reject(error);
        });
      }
    );

    xhr.addEventListener(
      'abort',
      () => {
        finish(() => {
          reject(
            createAbortError()
          );
        });
      }
    );

    signal?.addEventListener(
      'abort',
      handleSignalAbort,
      {
        once: true,
      }
    );

    xhr.send(chunk);
  });

const getExpectedChunkSize = ({
  index,
  fileSize,
  chunkSizeBytes,
}) => {
  const start =
    index * chunkSizeBytes;

  return Math.min(
    chunkSizeBytes,
    fileSize - start
  );
};

export async function uploadAdminVideoSource({
  jobId,
  file,
  signal,
  onProgress,

  chunkSizeBytes =
    getConfiguredUploadChunkSizeBytes(),

  maxChunkRetries =
    getConfiguredUploadChunkRetries(),

  concurrency =
    getConfiguredUploadConcurrency(),
}) {
  if (signal?.aborted) {
    throw createAbortError();
  }

  if (
    !(file instanceof File) ||
    file.size <= 0
  ) {
    throw new Error(
      'فایل ویدئویی معتبر نیست.'
    );
  }

  const normalizedChunkSize =
    Number(chunkSizeBytes);

  const normalizedMaxChunkRetries =
    Number(maxChunkRetries);

  const normalizedConcurrency =
    Number(concurrency);

  if (
    !Number.isSafeInteger(
      normalizedChunkSize
    ) ||
    normalizedChunkSize <= 0
  ) {
    throw new Error(
      'اندازه chunk آپلود معتبر نیست.'
    );
  }

  if (
    !Number.isInteger(
      normalizedMaxChunkRetries
    ) ||
    normalizedMaxChunkRetries < 0 ||
    normalizedMaxChunkRetries > 6
  ) {
    throw new Error(
      'تعداد تلاش مجدد آپلود معتبر نیست.'
    );
  }

  if (
    !Number.isInteger(
      normalizedConcurrency
    ) ||
    normalizedConcurrency < 1 ||
    normalizedConcurrency >
      MAX_UPLOAD_CONCURRENCY
  ) {
    throw new Error(
      'تعداد اتصال همزمان آپلود معتبر نیست.'
    );
  }

  const totalChunks =
    Math.max(
      1,
      Math.ceil(
        file.size /
          normalizedChunkSize
      )
    );

  const confirmedByChunk =
    new Map();

  const transientByChunk =
    new Map();

  const retryByChunk =
    new Map();

  const activeChunks =
    new Set();

  const uploadSessionStartedAt =
    Date.now();

  let sessionStartUploadedBytes =
    0;

  let lastSampleAt =
    Date.now();

  let lastLoadedBytes = 0;

  let smoothedBytesPerSecond = 0;

  let totalRetryCount = 0;

  const getConfirmedBytes = () => {
    let total = 0;

    for (
      let index = 0;
      index < totalChunks;
      index += 1
    ) {
      total +=
        confirmedByChunk.get(
          index
        ) || 0;
    }

    return total;
  };

  const getDisplayedBytes = () => {
    let total = 0;

    for (
      let index = 0;
      index < totalChunks;
      index += 1
    ) {
      const confirmed =
        confirmedByChunk.get(
          index
        ) || 0;

      const transient =
        transientByChunk.get(
          index
        ) || 0;

      total += Math.max(
        confirmed,
        transient
      );
    }

    return total;
  };

  const getCompletedChunks = () => {
    let completed = 0;

    for (
      let index = 0;
      index < totalChunks;
      index += 1
    ) {
      const expected =
        getExpectedChunkSize({
          index,
          fileSize: file.size,
          chunkSizeBytes:
            normalizedChunkSize,
        });

      if (
        (
          confirmedByChunk.get(
            index
          ) || 0
        ) >= expected
      ) {
        completed += 1;
      }
    }

    return completed;
  };

  const emitProgress = (
    measureSpeed = true
  ) => {
    const totalBytes =
      file.size;

    const confirmedUploadedBytes =
      Math.max(
        0,
        Math.min(
          totalBytes,
          getConfirmedBytes()
        )
      );

    const loadedBytes =
      Math.max(
        confirmedUploadedBytes,
        Math.min(
          totalBytes,
          getDisplayedBytes()
        )
      );

    const now =
      Date.now();

    if (
      !measureSpeed ||
      loadedBytes <
        lastLoadedBytes
    ) {
      lastLoadedBytes =
        loadedBytes;

      lastSampleAt = now;
    } else {
      const elapsedSeconds =
        Math.max(
          (
            now -
            lastSampleAt
          ) / 1000,
          0.001
        );

      const uploadedSinceLastSample =
        Math.max(
          0,
          loadedBytes -
            lastLoadedBytes
        );

      /*
       * Progress eventهای دو XHR ممکن است با فاصله چند
       * میلی‌ثانیه برسند. نمونه‌های خیلی کوتاه سرعت را
       * مصنوعی بزرگ می‌کنند، پس حداقل پنجره 250ms داریم.
       */
      if (
        elapsedSeconds >= 0.25 &&
        uploadedSinceLastSample > 0
      ) {
        const instantaneousSpeed =
          uploadedSinceLastSample /
          elapsedSeconds;

        smoothedBytesPerSecond =
          smoothedBytesPerSecond > 0
            ? (
                smoothedBytesPerSecond *
                  0.75
              ) +
              (
                instantaneousSpeed *
                  0.25
              )
            : instantaneousSpeed;

        lastSampleAt = now;
        lastLoadedBytes =
          loadedBytes;
      }
    }

    const progress =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (
              confirmedUploadedBytes /
              totalBytes
            ) * 100
          )
        )
      );

    const remainingBytes =
      Math.max(
        0,
        totalBytes -
          confirmedUploadedBytes
      );

    const etaSeconds =
      smoothedBytesPerSecond >
        0 &&
      remainingBytes > 0
        ? (
            remainingBytes /
            smoothedBytesPerSecond
          )
        : remainingBytes === 0
          ? 0
          : null;

    const elapsedSessionSeconds =
      Math.max(
        (
          now -
          uploadSessionStartedAt
        ) / 1000,
        0.001
      );

    const sessionUploadedBytes =
      Math.max(
        0,
        confirmedUploadedBytes -
          sessionStartUploadedBytes
      );

    const averageBytesPerSecond =
      sessionUploadedBytes > 0
        ? (
            sessionUploadedBytes /
            elapsedSessionSeconds
          )
        : 0;

    const completedChunks =
      getCompletedChunks();

    onProgress?.(
      progress,
      {
        loadedBytes:
          confirmedUploadedBytes,

        totalBytes,

        confirmedUploadedBytes,

        bytesPerSecond:
          smoothedBytesPerSecond,

        averageBytesPerSecond,

        etaSeconds,

        chunkSizeBytes:
          normalizedChunkSize,

        currentChunk:
          Math.min(
            totalChunks,
            completedChunks +
              activeChunks.size
          ),

        completedChunks,
        totalChunks,

        retryCount:
          totalRetryCount,

        uploadConcurrency:
          normalizedConcurrency,

        activeChunks:
          activeChunks.size,
      }
    );
  };

  const applyServerStatus = (
    upload
  ) => {
    const chunks =
      Array.isArray(
        upload?.chunks
      )
        ? upload.chunks
        : [];

    chunks.forEach(
      (chunkState) => {
        const index =
          Number(
            chunkState?.index
          );

        if (
          !Number.isInteger(
            index
          ) ||
          index < 0 ||
          index >= totalChunks
        ) {
          return;
        }

        const expected =
          getExpectedChunkSize({
            index,
            fileSize:
              file.size,
            chunkSizeBytes:
              normalizedChunkSize,
          });

        const uploaded =
          Math.max(
            0,
            Math.min(
              expected,
              Number(
                chunkState
                  ?.uploadedBytes
              ) || 0
            )
          );

        confirmedByChunk.set(
          index,
          uploaded
        );

        transientByChunk.set(
          index,
          uploaded
        );
      }
    );
  };

  let uploadState =
    await getAdminVideoSourceUploadStatus({
      jobId,
      file,
      signal,

      chunkSizeBytes:
        normalizedChunkSize,
    });

  if (
    uploadState?.job?.status &&
    uploadState.job.status !==
      'UPLOADING'
  ) {
    return uploadState;
  }

  applyServerStatus(
    uploadState?.upload
  );

  /*
   * اگر Source از قبل توسط نسخه قبلی کلاینت کامل شده باشد،
   * GET ممکن است chunks خالی ولی complete=true برگرداند.
   */
  if (
    uploadState?.upload
      ?.complete &&
    uploadState?.upload
      ?.finalized
  ) {
    const finalized =
      await finalizeAdminVideoSourceUpload({
        jobId,
        file,
        signal,

        chunkSizeBytes:
          normalizedChunkSize,
      });

    return finalized;
  }

  sessionStartUploadedBytes =
    getConfirmedBytes();

  emitProgress(false);

  const pendingChunks = [];

  for (
    let index = 0;
    index < totalChunks;
    index += 1
  ) {
    const expected =
      getExpectedChunkSize({
        index,
        fileSize: file.size,
        chunkSizeBytes:
          normalizedChunkSize,
      });

    if (
      (
        confirmedByChunk.get(
          index
        ) || 0
      ) < expected
    ) {
      pendingChunks.push(
        index
      );
    }
  }

  let nextPendingIndex = 0;

  const syncFromServer =
    async () => {
      uploadState =
        await getAdminVideoSourceUploadStatus({
          jobId,
          file,
          signal,

          chunkSizeBytes:
            normalizedChunkSize,
        });

      if (
        uploadState?.job?.status &&
        uploadState.job.status !==
          'UPLOADING'
      ) {
        return uploadState;
      }

      applyServerStatus(
        uploadState?.upload
      );

      emitProgress(false);

      return uploadState;
    };

  const uploadOneChunk =
    async (chunkIndex) => {
      const chunkStart =
        chunkIndex *
        normalizedChunkSize;

      const expectedSize =
        getExpectedChunkSize({
          index: chunkIndex,
          fileSize:
            file.size,
          chunkSizeBytes:
            normalizedChunkSize,
        });

      let retryCount =
        retryByChunk.get(
          chunkIndex
        ) || 0;

      while (true) {
        if (
          signal?.aborted
        ) {
          throw createAbortError();
        }

        const confirmed =
          confirmedByChunk.get(
            chunkIndex
          ) || 0;

        if (
          confirmed >=
          expectedSize
        ) {
          transientByChunk.set(
            chunkIndex,
            expectedSize
          );

          emitProgress(false);
          return;
        }

        const absoluteOffset =
          chunkStart +
          confirmed;

        const chunkEnd =
          chunkStart +
          expectedSize;

        const chunk =
          file.slice(
            absoluteOffset,
            chunkEnd,
            getVideoUploadContentType(
              file
            )
          );

        activeChunks.add(
          chunkIndex
        );

        transientByChunk.set(
          chunkIndex,
          confirmed
        );

        emitProgress(false);

        try {
          const response =
            await uploadAdminVideoChunk({
              jobId,
              file,
              chunk,

              uploadOffset:
                absoluteOffset,

              chunkIndex,

              chunkSizeBytes:
                normalizedChunkSize,

              signal,

              onChunkProgress: (
                requestLoadedBytes
              ) => {
                transientByChunk.set(
                  chunkIndex,

                  Math.min(
                    expectedSize,
                    confirmed +
                      requestLoadedBytes
                  )
                );

                emitProgress(true);
              },
            });

          const serverChunk =
            response?.upload?.chunk;

          if (
            Number(
              serverChunk?.index
            ) === chunkIndex
          ) {
            const serverBytes =
              Math.max(
                0,
                Math.min(
                  expectedSize,
                  Number(
                    serverChunk
                      ?.uploadedBytes
                  ) || 0
                )
              );

            confirmedByChunk.set(
              chunkIndex,
              serverBytes
            );

            transientByChunk.set(
              chunkIndex,
              serverBytes
            );
          } else {
            applyServerStatus(
              response?.upload
            );
          }

          retryCount = 0;

          retryByChunk.set(
            chunkIndex,
            0
          );

          emitProgress(false);
        } catch (error) {
          if (
            !isRetryableUploadError(
              error
            ) ||
            retryCount >=
              normalizedMaxChunkRetries
          ) {
            throw error;
          }

          retryCount += 1;
          totalRetryCount += 1;

          retryByChunk.set(
            chunkIndex,
            retryCount
          );

          emitProgress(false);

          await sleep(
            500 *
              2 **
                (
                  retryCount -
                  1
                ),
            signal
          );

          const currentState =
            await syncFromServer();

          if (
            currentState?.job
              ?.status &&
            currentState.job
              .status !==
              'UPLOADING'
          ) {
            return;
          }
        } finally {
          activeChunks.delete(
            chunkIndex
          );

          emitProgress(false);
        }
      }
    };

  const worker =
    async () => {
      while (true) {
        const queueIndex =
          nextPendingIndex;

        nextPendingIndex += 1;

        if (
          queueIndex >=
          pendingChunks.length
        ) {
          return;
        }

        await uploadOneChunk(
          pendingChunks[
            queueIndex
          ]
        );
      }
    };

  const workerCount =
    Math.min(
      normalizedConcurrency,
      Math.max(
        1,
        pendingChunks.length
      )
    );

  const workerResults =
    await Promise.allSettled(
      Array.from(
        {
          length:
            workerCount,
        },
        () => worker()
      )
    );

  const failedWorker =
    workerResults.find(
      (result) =>
        result.status ===
        'rejected'
    );

  if (
    failedWorker?.status ===
    'rejected'
  ) {
    throw failedWorker.reason;
  }

  uploadState =
    await syncFromServer();

  if (
    uploadState?.job?.status &&
    uploadState.job.status !==
      'UPLOADING'
  ) {
    return uploadState;
  }

  if (
    !uploadState?.upload
      ?.complete
  ) {
    throw new Error(
      'همه بخش‌های فایل روی سرور کامل نشده‌اند.'
    );
  }

  let finalizeRetryCount = 0;

  while (true) {
    try {
      const finalized =
        await finalizeAdminVideoSourceUpload({
          jobId,
          file,
          signal,

          chunkSizeBytes:
            normalizedChunkSize,
        });

      const fullChunkStates =
        Array.from(
          {
            length:
              totalChunks,
          },
          (_, index) => [
            index,

            getExpectedChunkSize({
              index,
              fileSize:
                file.size,
              chunkSizeBytes:
                normalizedChunkSize,
            }),
          ]
        );

      fullChunkStates.forEach(
        ([index, size]) => {
          confirmedByChunk.set(
            index,
            size
          );

          transientByChunk.set(
            index,
            size
          );
        }
      );

      emitProgress(false);

      return finalized;
    } catch (error) {
      if (
        !isRetryableUploadError(
          error
        ) ||
        finalizeRetryCount >=
          normalizedMaxChunkRetries
      ) {
        throw error;
      }

      finalizeRetryCount += 1;
      totalRetryCount += 1;

      emitProgress(false);

      await sleep(
        500 *
          2 **
            (
              finalizeRetryCount -
              1
            ),
        signal
      );

      const currentState =
        await getAdminVideoSourceUploadStatus({
          jobId,
          file,
          signal,

          chunkSizeBytes:
            normalizedChunkSize,
        });

      if (
        currentState?.job
          ?.status &&
        currentState.job
          .status !==
          'UPLOADING'
      ) {
        return currentState;
      }
    }
  }
}

export async function getAdminVideoJob({ jobId, signal }) {
  const response = await fetch(
    `/api/admin/video-jobs/${encodeURIComponent(jobId)}`,
    {
      method: 'GET',
      cache: 'no-store',
      signal,
    }
  );

  const data = await readJsonResponse(response);

  return data.job;
}

export async function waitForAdminVideoJob({
  jobId,
  signal,
  onUpdate,
  intervalMs = 2000,
}) {
  while (true) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const job = await getAdminVideoJob({
      jobId,
      signal,
    });

    onUpdate?.(job);

    if (job.status === 'READY') {
      return job;
    }

    if (job.status === 'FAILED') {
      throw new Error(job.errorMessage || 'پردازش ویدئو با خطا مواجه شد.');
    }

    if (job.status === 'CANCELLED') {
      throw new Error('عملیات ویدئو لغو شده است.');
    }

    if (TERMINAL_STATUSES.includes(job.status)) {
      return job;
    }

    await sleep(intervalMs, signal);
  }
}

export async function cancelAdminVideoJob({ jobId }) {
  const response = await fetch(
    `/api/admin/video-jobs/${encodeURIComponent(jobId)}`,
    {
      method: 'DELETE',
    }
  );

  return readJsonResponse(response);
}

export async function retryAdminVideoJob({
  jobId,
  signal,
}) {
  const response = await fetch(
    `/api/admin/video-jobs/${encodeURIComponent(jobId)}/retry`,
    {
      method: 'POST',
      signal,
    }
  );

  const data =
    await readJsonResponse(
      response
    );

  return data.job;
}

export async function createAdminCourseIntroVideoJob({
  courseId,
  courseTitle,
  signal,
}) {
  const response = await fetch('/api/admin/course-intro-video-jobs', {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      courseId: courseId || null,
      courseTitle,
    }),

    signal,
  });

  const data = await readJsonResponse(response);

  return data.job;
}

export async function listActiveAdminVideoJobs({ signal } = {}) {
  const response = await fetch('/api/admin/video-jobs', {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  const data = await readJsonResponse(response);

  return Array.isArray(data.jobs) ? data.jobs : [];
}
