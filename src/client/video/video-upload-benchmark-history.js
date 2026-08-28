const STORAGE_KEY =
  'teaching-yoga:video-upload-benchmark-history:v1';

export const VIDEO_UPLOAD_BENCHMARK_HISTORY_CHANGED_EVENT =
  'teaching-yoga:video-upload-benchmark-history-changed';

const MAX_HISTORY_ITEMS = 30;

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

const normalizePositiveNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return fallback;
  }

  return number;
};

const normalizeRequiredString = (
  value
) => {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    return null;
  }

  return value.trim();
};

const normalizeRun = (run) => {
  const jobId =
    normalizeRequiredString(
      run?.jobId
    );

  if (!jobId) {
    return null;
  }

  const createdAt =
    normalizePositiveNumber(
      run?.createdAt,
      Date.now()
    );

  const chunkSizeBytes =
    normalizePositiveNumber(
      run?.chunkSizeBytes
    );

  const concurrency =
    Math.max(
      1,
      Math.min(
        3,
        Math.round(
          normalizePositiveNumber(
            run?.concurrency,
            1
          )
        )
      )
    );

  return {
    jobId,

    taskId:
      normalizeRequiredString(
        run?.taskId
      ),

    fileName:
      normalizeRequiredString(
        run?.fileName
      ) || 'video',

    totalBytes:
      normalizePositiveNumber(
        run?.totalBytes
      ),

    chunkSizeBytes,

    concurrency,

    retryCount:
      Math.max(
        0,
        Math.round(
          normalizePositiveNumber(
            run?.retryCount
          )
        )
      ),

    averageBytesPerSecond:
      normalizePositiveNumber(
        run?.averageBytesPerSecond
      ),

    durationMs:
      normalizePositiveNumber(
        run?.durationMs
      ),

    createdAt,

    targetType:
      normalizeRequiredString(
        run?.targetType
      ),
  };
};

const parseHistory = (raw) => {
  if (
    typeof raw !== 'string' ||
    !raw
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeRun)
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.createdAt -
          a.createdAt
      )
      .slice(
        0,
        MAX_HISTORY_ITEMS
      );
  } catch {
    return [];
  }
};

const emitChanged = () => {
  try {
    if (
      typeof window ===
        'undefined' ||
      typeof window.dispatchEvent !==
        'function'
    ) {
      return;
    }

    window.dispatchEvent(
      new Event(
        VIDEO_UPLOAD_BENCHMARK_HISTORY_CHANGED_EVENT
      )
    );
  } catch {
    // History is diagnostic-only and must never break upload.
  }
};

export const getVideoUploadBenchmarkHistory =
  ({
    storage =
      getBrowserStorage(),
  } = {}) => {
    if (!storage) {
      return [];
    }

    try {
      return parseHistory(
        storage.getItem(
          STORAGE_KEY
        )
      );
    } catch {
      return [];
    }
  };

export const recordVideoUploadBenchmarkRun =
  (
    run,
    {
      storage =
        getBrowserStorage(),

      notify = true,
    } = {}
  ) => {
    const normalized =
      normalizeRun(run);

    if (
      !normalized ||
      !storage
    ) {
      return normalized;
    }

    try {
      const previous =
        getVideoUploadBenchmarkHistory({
          storage,
        });

      const next = [
        normalized,
        ...previous.filter(
          (item) =>
            item.jobId !==
            normalized.jobId
        ),
      ]
        .sort(
          (a, b) =>
            b.createdAt -
            a.createdAt
        )
        .slice(
          0,
          MAX_HISTORY_ITEMS
        );

      storage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );

      if (notify) {
        emitChanged();
      }

      return normalized;
    } catch {
      return normalized;
    }
  };

export const clearVideoUploadBenchmarkHistory =
  ({
    storage =
      getBrowserStorage(),

    notify = true,
  } = {}) => {
    try {
      storage?.removeItem(
        STORAGE_KEY
      );

      if (notify) {
        emitChanged();
      }
    } catch {
      // Diagnostics must not affect upload functionality.
    }
  };
