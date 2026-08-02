/* eslint-disable no-constant-condition */
const TERMINAL_STATUSES = ['READY', 'FAILED', 'CANCELLED'];

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

export function uploadAdminVideoSource({ jobId, file, signal, onProgress }) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const xhr = new XMLHttpRequest();

    let settled = false;

    const cleanup = () => {
      signal?.removeEventListener('abort', handleSignalAbort);
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

    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

    xhr.setRequestHeader('X-File-Name', file.name || 'source.mp4');

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);

      onProgress?.(Math.max(0, Math.min(100, progress)));
    });

    xhr.addEventListener('load', () => {
      finish(() => {
        let data = {};

        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        } catch {
          reject(new Error('پاسخ نامعتبر از API آپلود دریافت شد.'));

          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          const error = new Error(
            data?.error || `آپلود با خطای HTTP ${xhr.status} مواجه شد.`
          );

          error.status = xhr.status;
          error.data = data;

          reject(error);
          return;
        }

        onProgress?.(100);
        resolve(data);
      });
    });

    xhr.addEventListener('error', () => {
      finish(() => {
        reject(new Error('ارتباط با سرور هنگام آپلود قطع شد.'));
      });
    });

    xhr.addEventListener('abort', () => {
      finish(() => {
        reject(createAbortError());
      });
    });

    signal?.addEventListener('abort', handleSignalAbort, {
      once: true,
    });

    xhr.send(file);
  });
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
