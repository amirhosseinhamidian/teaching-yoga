/* eslint-disable no-undef */
import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEALTH_TIMEOUT_MS = 5000;

const withTimeout = async (promise, timeoutMs) => {
  let timeoutId;

  try {
    return await Promise.race([
      promise,

      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Health check timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const handleGet = async () => {
  const log = getRequestLogger({
    component: 'health',
  });

  const startedAt = performance.now();

  try {
    await withTimeout(prismadb.$queryRaw`SELECT 1`, HEALTH_TIMEOUT_MS);

    const durationMs = Number((performance.now() - startedAt).toFixed(1));

    return NextResponse.json(
      {
        status: 'ok',
        service: process.env.LOG_SERVICE || 'teaching-yoga-web',

        database: 'ok',

        uptimeSeconds: Math.floor(process.uptime()),

        timestamp: new Date().toISOString(),

        durationMs,
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    logError({
      log,
      error,

      message: 'Application health check failed',

      data: {
        event: 'health_check_failed',

        database: 'unavailable',
      },
    });

    return NextResponse.json(
      {
        status: 'error',
        database: 'unavailable',

        timestamp: new Date().toISOString(),
      },
      {
        status: 503,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/health',
  component: 'health-api',

  // درخواست‌های Health موفق لاگ را شلوغ نکنند.
  logSuccess: false,
});
