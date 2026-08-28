/* eslint-disable no-undef */

import path from 'node:path';

import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';

const DEFAULT_HEARTBEAT_PATH =
  './storage/worker/video-worker-heartbeat.json';

const DEFAULT_HEARTBEAT_INTERVAL_MS =
  10 * 1000;

const DEFAULT_HEARTBEAT_STALE_AFTER_MS =
  45 * 1000;

const HEARTBEAT_VERSION = 1;

const getPositiveInteger = (
  value,
  fallback
) => {
  const number = Number(value);

  if (
    Number.isSafeInteger(number) &&
    number > 0
  ) {
    return number;
  }

  return fallback;
};

export const getVideoWorkerHeartbeatIntervalMs =
  () =>
    getPositiveInteger(
      process.env
        .VIDEO_WORKER_HEARTBEAT_INTERVAL_MS,

      DEFAULT_HEARTBEAT_INTERVAL_MS
    );

export const getVideoWorkerHeartbeatStaleAfterMs =
  () =>
    getPositiveInteger(
      process.env
        .VIDEO_WORKER_HEARTBEAT_STALE_AFTER_MS,

      DEFAULT_HEARTBEAT_STALE_AFTER_MS
    );

export const getVideoWorkerHeartbeatPath =
  () =>
    path.resolve(
      process.cwd(),

      process.env
        .VIDEO_WORKER_HEARTBEAT_PATH ||
        DEFAULT_HEARTBEAT_PATH
    );

const normalizeOptionalString = (
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

export async function writeVideoWorkerHeartbeat({
  status = 'running',
  startedAt = null,
  lastJobId = null,
  lastJobCompletedAt = null,
} = {}) {
  const heartbeatPath =
    getVideoWorkerHeartbeatPath();

  await mkdir(
    path.dirname(heartbeatPath),
    {
      recursive: true,
    }
  );

  const payload = {
    version: HEARTBEAT_VERSION,

    status:
      normalizeOptionalString(status) ||
      'running',

    pid: process.pid,

    startedAt:
      normalizeOptionalString(
        startedAt
      ),

    updatedAt:
      new Date().toISOString(),

    lastJobId:
      normalizeOptionalString(
        lastJobId
      ),

    lastJobCompletedAt:
      normalizeOptionalString(
        lastJobCompletedAt
      ),
  };

  /*
   * Health endpoint نباید هیچ‌وقت JSON نیمه‌نوشته
   * بخواند؛ ابتدا temp و سپس rename اتمیک.
   */
  const temporaryPath =
    `${heartbeatPath}.${process.pid}.tmp`;

  await writeFile(
    temporaryPath,
    JSON.stringify(
      payload,
      null,
      2
    ),
    {
      encoding: 'utf8',
    }
  );

  await rename(
    temporaryPath,
    heartbeatPath
  );

  return payload;
}

export async function readVideoWorkerHeartbeat({
  now = Date.now(),
  staleAfterMs =
    getVideoWorkerHeartbeatStaleAfterMs(),
} = {}) {
  const heartbeatPath =
    getVideoWorkerHeartbeatPath();

  let raw;

  try {
    raw = await readFile(
      heartbeatPath,
      'utf8'
    );
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        exists: false,
        valid: false,
        healthy: false,
        stale: true,
        status: 'missing',
        ageMs: null,
        staleAfterMs,
        pid: null,
        startedAt: null,
        updatedAt: null,
        lastJobId: null,
        lastJobCompletedAt: null,
      };
    }

    throw error;
  }

  let payload;

  try {
    payload = JSON.parse(raw);
  } catch {
    return {
      exists: true,
      valid: false,
      healthy: false,
      stale: true,
      status: 'invalid',
      ageMs: null,
      staleAfterMs,
      pid: null,
      startedAt: null,
      updatedAt: null,
      lastJobId: null,
      lastJobCompletedAt: null,
    };
  }

  const updatedAtMs =
    Date.parse(
      payload?.updatedAt || ''
    );

  const valid =
    payload?.version ===
      HEARTBEAT_VERSION &&
    Number.isFinite(updatedAtMs);

  if (!valid) {
    return {
      exists: true,
      valid: false,
      healthy: false,
      stale: true,
      status: 'invalid',
      ageMs: null,
      staleAfterMs,
      pid: null,
      startedAt: null,
      updatedAt: null,
      lastJobId: null,
      lastJobCompletedAt: null,
    };
  }

  const ageMs =
    Math.max(
      0,
      Number(now) - updatedAtMs
    );

  const status =
    normalizeOptionalString(
      payload.status
    ) || 'unknown';

  const stale =
    ageMs > staleAfterMs;

  const healthy =
    status === 'running' &&
    !stale;

  return {
    exists: true,
    valid: true,
    healthy,
    stale,
    status,
    ageMs,
    staleAfterMs,

    pid:
      Number.isSafeInteger(
        Number(payload.pid)
      )
        ? Number(payload.pid)
        : null,

    startedAt:
      normalizeOptionalString(
        payload.startedAt
      ),

    updatedAt:
      payload.updatedAt,

    lastJobId:
      normalizeOptionalString(
        payload.lastJobId
      ),

    lastJobCompletedAt:
      normalizeOptionalString(
        payload.lastJobCompletedAt
      ),
  };
}

export function createVideoWorkerHeartbeat({
  intervalMs =
    getVideoWorkerHeartbeatIntervalMs(),

  onError,
} = {}) {
  const normalizedIntervalMs =
    getPositiveInteger(
      intervalMs,
      DEFAULT_HEARTBEAT_INTERVAL_MS
    );

  const state = {
    status: 'running',

    startedAt:
      new Date().toISOString(),

    lastJobId: null,
    lastJobCompletedAt: null,
  };

  let timer = null;
  let stopped = false;

  let writeChain =
    Promise.resolve();

  const reportError = (error) => {
    try {
      onError?.(error);
    } catch {
      // Monitoring must never stop the worker.
    }
  };

  const persist = (
    status = state.status
  ) => {
    state.status = status;

    writeChain =
      writeChain
        .catch(() => {})
        .then(() =>
          writeVideoWorkerHeartbeat(
            state
          )
        )
        .catch((error) => {
          reportError(error);
          return null;
        });

    return writeChain;
  };

  return {
    async start() {
      if (timer || stopped) {
        return;
      }

      await persist('running');

      timer = setInterval(() => {
        void persist('running');
      }, normalizedIntervalMs);

      timer.unref?.();
    },

    markJobCompleted(job) {
      if (stopped) {
        return Promise.resolve(
          null
        );
      }

      state.lastJobId =
        normalizeOptionalString(
          job?.id
        );

      state.lastJobCompletedAt =
        new Date().toISOString();

      return persist('running');
    },

    async stop() {
      if (stopped) {
        return;
      }

      stopped = true;

      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      await persist('stopped');
    },
  };
}
