/* eslint-disable no-undef */

import path from 'node:path';

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import {
  getVideoDiskSpace,
} from '@/server/video/disk-space';

import {
  getVideoWorkerHeartbeatStaleAfterMs,
  readVideoWorkerHeartbeat,
} from '@/server/video/worker/video-worker-heartbeat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = [
  'UPLOADING',
  'QUEUED',
  'PROCESSING',
  'PUBLISHING',
];

const RUNNING_STATUSES = [
  'PROCESSING',
  'PUBLISHING',
];

const DEFAULT_STALE_JOB_AFTER_MS =
  5 * 60 * 1000;

const DEFAULT_DISK_RESERVE_BYTES =
  2 * 1024 * 1024 * 1024;

const FAILED_WINDOW_MS =
  24 * 60 * 60 * 1000;

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

const getStaleJobAfterMs = () =>
  getPositiveInteger(
    process.env
      .VIDEO_WORKER_STALE_AFTER_MS,

    DEFAULT_STALE_JOB_AFTER_MS
  );

const getDiskReserveBytes = () =>
  getPositiveInteger(
    process.env
      .VIDEO_DISK_RESERVE_BYTES,

    DEFAULT_DISK_RESERVE_BYTES
  );

const getDiskCheckPath = () => {
  const configuredRoot =
    process.env.VIDEO_UPLOAD_ROOT;

  if (
    typeof configuredRoot ===
      'string' &&
    configuredRoot.trim()
  ) {
    return path.resolve(
      process.cwd(),
      configuredRoot.trim()
    );
  }

  return path.resolve(
    process.cwd(),
    './storage'
  );
};

const getDiskSnapshot = async () => {
  const reserveBytes =
    getDiskReserveBytes();

  let diskSpace;

  try {
    diskSpace =
      await getVideoDiskSpace(
        getDiskCheckPath()
      );
  } catch {
    /*
     * قبل از اولین upload ممکن است storage root
     * هنوز ساخته نشده باشد.
     */
    diskSpace =
      await getVideoDiskSpace(
        process.cwd()
      );
  }

  const warningThreshold =
    reserveBytes * 2;

  const level =
    diskSpace.availableBytes <
    reserveBytes
      ? 'critical'
      : diskSpace.availableBytes <
          warningThreshold
        ? 'warning'
        : 'ok';

  return {
    level,

    availableBytes:
      diskSpace.availableBytes,

    reserveBytes,

    warningThresholdBytes:
      warningThreshold,
  };
};

const normalizeQueueCounts = (
  grouped
) => {
  const counts = {
    uploading: 0,
    queued: 0,
    processing: 0,
    publishing: 0,
  };

  for (const row of grouped) {
    const count =
      Number(
        row?._count?._all
      ) || 0;

    switch (row.status) {
      case 'UPLOADING':
        counts.uploading = count;
        break;

      case 'QUEUED':
        counts.queued = count;
        break;

      case 'PROCESSING':
        counts.processing = count;
        break;

      case 'PUBLISHING':
        counts.publishing = count;
        break;

      default:
        break;
    }
  }

  return {
    ...counts,

    active:
      counts.uploading +
      counts.queued +
      counts.processing +
      counts.publishing,
  };
};

const handleGet = async () => {
  const auth =
    await requireAdminApi();

  if (!auth.ok) {
    return auth.response;
  }

  const now = Date.now();

  const staleJobAfterMs =
    getStaleJobAfterMs();

  const staleBefore =
    new Date(
      now - staleJobAfterMs
    );

  const failedSince =
    new Date(
      now - FAILED_WINDOW_MS
    );

  const heartbeatStaleAfterMs =
    getVideoWorkerHeartbeatStaleAfterMs();

  const [
    grouped,
    staleRunning,
    recentFailed,
    oldestQueued,
    worker,
    disk,
  ] = await Promise.all([
    prismadb.videoProcessingJob.groupBy({
      by: ['status'],

      where: {
        status: {
          in: ACTIVE_STATUSES,
        },
      },

      _count: {
        _all: true,
      },
    }),

    prismadb.videoProcessingJob.count({
      where: {
        status: {
          in: RUNNING_STATUSES,
        },

        updatedAt: {
          lt: staleBefore,
        },
      },
    }),

    prismadb.videoProcessingJob.count({
      where: {
        status: 'FAILED',

        completedAt: {
          gte: failedSince,
        },
      },
    }),

    prismadb.videoProcessingJob.findFirst({
      where: {
        status: 'QUEUED',
      },

      orderBy: {
        createdAt: 'asc',
      },

      select: {
        createdAt: true,
      },
    }),

    readVideoWorkerHeartbeat({
      now,
      staleAfterMs:
        heartbeatStaleAfterMs,
    }),

    getDiskSnapshot(),
  ]);

  const queue =
    normalizeQueueCounts(
      grouped
    );

  const oldestQueuedAgeMs =
    oldestQueued?.createdAt
      ? Math.max(
          0,
          now -
            oldestQueued
              .createdAt
              .getTime()
        )
      : null;

  const issues = [];

  if (!worker.healthy) {
    issues.push(
      'worker_heartbeat_unhealthy'
    );
  }

  if (disk.level === 'critical') {
    issues.push(
      'disk_space_critical'
    );
  } else if (
    disk.level === 'warning'
  ) {
    issues.push(
      'disk_space_warning'
    );
  }

  if (staleRunning > 0) {
    issues.push(
      'stale_running_jobs'
    );
  }

  if (recentFailed > 0) {
    issues.push(
      'recent_failed_jobs'
    );
  }

  const status =
    !worker.healthy ||
    disk.level === 'critical'
      ? 'critical'
      : issues.length > 0
        ? 'degraded'
        : 'healthy';

  return NextResponse.json(
    {
      success: true,

      health: {
        status,
        checkedAt:
          new Date(now)
            .toISOString(),

        issues,

        worker: {
          healthy:
            worker.healthy,

          status:
            worker.status,

          stale:
            worker.stale,

          ageMs:
            worker.ageMs,

          staleAfterMs:
            worker.staleAfterMs,

          startedAt:
            worker.startedAt,

          updatedAt:
            worker.updatedAt,

          lastJobCompletedAt:
            worker.lastJobCompletedAt,
        },

        queue: {
          ...queue,

          staleRunning,

          staleAfterMs:
            staleJobAfterMs,

          oldestQueuedAgeMs,
        },

        failures: {
          last24Hours:
            recentFailed,
        },

        disk,
      },
    },
    {
      status: 200,

      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate',
      },
    }
  );
};

export const GET = handleGet;
