const STORAGE_KEY =
  'teaching-yoga:video-upload-tuning:v1';

const DEFAULT_CHUNK_SIZE_MIB = 16;
const MIN_CHUNK_SIZE_MIB = 4;
const MAX_CHUNK_SIZE_MIB = 64;

const DEFAULT_CONCURRENCY = 2;
const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 3;

const ENV_CHUNK_SIZE_MIB = Number(
  process.env
    .NEXT_PUBLIC_VIDEO_UPLOAD_CHUNK_SIZE_MB
);

const ENV_CONCURRENCY = Number(
  process.env
    .NEXT_PUBLIC_VIDEO_UPLOAD_CONCURRENCY
);

const getBrowserStorage = () => {
  try {
    if (
      typeof window === 'undefined' ||
      !window.localStorage
    ) {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
};

const normalizeChunkSizeMiB = (
  value,
  fallback = null
) => {
  const number = Number(value);

  if (
    Number.isInteger(number) &&
    number >= MIN_CHUNK_SIZE_MIB &&
    number <= MAX_CHUNK_SIZE_MIB
  ) {
    return number;
  }

  return fallback;
};

const normalizeConcurrency = (
  value,
  fallback = null
) => {
  const number = Number(value);

  if (
    Number.isInteger(number) &&
    number >= MIN_CONCURRENCY &&
    number <= MAX_CONCURRENCY
  ) {
    return number;
  }

  return fallback;
};

const toResult = ({
  chunkSizeMiB,
  concurrency,
  source,
}) => ({
  chunkSizeMiB,

  chunkSizeBytes:
    chunkSizeMiB *
    1024 *
    1024,

  concurrency,
  source,
});

export const VIDEO_UPLOAD_BENCHMARK_CHUNK_SIZES_MIB =
  [16, 32];

export const VIDEO_UPLOAD_BENCHMARK_CONCURRENCIES =
  [1, 2, 3];

export const getDefaultVideoUploadTuning =
  () => {
    const chunkSizeMiB =
      normalizeChunkSizeMiB(
        ENV_CHUNK_SIZE_MIB,
        DEFAULT_CHUNK_SIZE_MIB
      );

    const concurrency =
      normalizeConcurrency(
        ENV_CONCURRENCY,
        DEFAULT_CONCURRENCY
      );

    return toResult({
      chunkSizeMiB,
      concurrency,
      source: 'environment',
    });
  };

const parseStoredOverride = (
  raw
) => {
  if (
    typeof raw !== 'string' ||
    !raw
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(raw);

    const chunkSizeMiB =
      normalizeChunkSizeMiB(
        parsed?.chunkSizeMiB
      );

    const concurrency =
      normalizeConcurrency(
        parsed?.concurrency
      );

    if (
      !chunkSizeMiB ||
      !concurrency
    ) {
      return null;
    }

    return toResult({
      chunkSizeMiB,
      concurrency,
      source: 'runtime',
    });
  } catch {
    return null;
  }
};

export const getVideoUploadRuntimeTuning =
  ({
    storage =
      getBrowserStorage(),
  } = {}) => {
    if (storage) {
      try {
        const stored =
          parseStoredOverride(
            storage.getItem(
              STORAGE_KEY
            )
          );

        if (stored) {
          return stored;
        }
      } catch {
        // Fall back to env/defaults.
      }
    }

    return getDefaultVideoUploadTuning();
  };

export const setVideoUploadRuntimeTuning =
  ({
    chunkSizeMiB,
    concurrency,
  }, {
    storage =
      getBrowserStorage(),
  } = {}) => {
    const normalizedChunkSizeMiB =
      normalizeChunkSizeMiB(
        chunkSizeMiB
      );

    const normalizedConcurrency =
      normalizeConcurrency(
        concurrency
      );

    if (!normalizedChunkSizeMiB) {
      throw new RangeError(
        'Video upload chunk size must be between 4 and 64 MiB.'
      );
    }

    if (!normalizedConcurrency) {
      throw new RangeError(
        'Video upload concurrency must be between 1 and 3.'
      );
    }

    const result =
      toResult({
        chunkSizeMiB:
          normalizedChunkSizeMiB,

        concurrency:
          normalizedConcurrency,

        source: 'runtime',
      });

    if (storage) {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          chunkSizeMiB:
            result.chunkSizeMiB,

          concurrency:
            result.concurrency,
        })
      );
    }

    return result;
  };

export const clearVideoUploadRuntimeTuning =
  ({
    storage =
      getBrowserStorage(),
  } = {}) => {
    try {
      storage?.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Defaults remain usable even if storage is blocked.
    }

    return getDefaultVideoUploadTuning();
  };
