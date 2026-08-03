/* eslint-disable no-undef */

import dotenv from 'dotenv';

dotenv.config();

const abortController = new AbortController();

const normalizeFatalError = (value) => {
  if (value instanceof Error) {
    return value;
  }

  try {
    return new Error(typeof value === 'string' ? value : JSON.stringify(value));
  } catch {
    return new Error('Unknown fatal worker error');
  }
};

async function bootstrap() {
  const [loggerModule, workerModule, prismaModule] = await Promise.all([
    import('../src/server/logger/index.js'),

    import('../src/server/video/worker/run-video-worker.js'),

    import('../libs/prismadb.js'),
  ]);

  const { logger, logFatal, logError } = loggerModule;

  const { runVideoWorker } = workerModule;

  const prismadb = prismaModule.default;

  const log = logger.child({
    component: 'video-worker-entrypoint',
  });

  let shuttingDown = false;
  let fatalError = false;

  const requestShutdown = (reason, { fatal = false } = {}) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    if (fatal) {
      fatalError = true;
    }

    log.info(
      {
        event: 'video_worker_shutdown_requested',

        reason,
        fatal,
      },

      'Video worker shutdown requested'
    );

    abortController.abort();
  };

  process.once('SIGINT', () => {
    requestShutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    requestShutdown('SIGTERM');
  });

  process.once('unhandledRejection', (reason) => {
    logFatal({
      log,

      error: normalizeFatalError(reason),

      message: 'Unhandled promise rejection in video worker',

      data: {
        event: 'video_worker_unhandled_rejection',
      },
    });

    requestShutdown('unhandledRejection', {
      fatal: true,
    });
  });

  process.once('uncaughtException', (error) => {
    logFatal({
      log,
      error,

      message: 'Uncaught exception in video worker',

      data: {
        event: 'video_worker_uncaught_exception',
      },
    });

    requestShutdown('uncaughtException', {
      fatal: true,
    });
  });

  try {
    log.info(
      {
        event: 'video_worker_process_started',

        nodeVersion: process.version,
      },

      'Video worker process started'
    );

    await runVideoWorker({
      signal: abortController.signal,
    });
  } catch (error) {
    fatalError = true;

    logFatal({
      log,
      error,

      message: 'Fatal video worker error',

      data: {
        event: 'video_worker_fatal_error',
      },
    });
  } finally {
    log.info(
      {
        event: 'video_worker_database_disconnect_started',
      },

      'Closing video worker database connection'
    );

    await prismadb.$disconnect().catch((error) => {
      fatalError = true;

      logError({
        log,
        error,

        message: 'Video worker Prisma disconnect failed',

        data: {
          event: 'video_worker_database_disconnect_failed',
        },
      });
    });

    log.info(
      {
        event: 'video_worker_process_stopped',

        fatal: fatalError,
      },

      'Video worker process stopped'
    );

    if (fatalError) {
      process.exitCode = 1;
    }
  }
}

bootstrap().catch((error) => {
  /*
   * این Fallback فقط زمانی اجرا می‌شود که حتی
   * خود Logger یا ماژول‌های اولیه قابل Import نباشند.
   */
  const payload = {
    level: 'fatal',
    time: new Date().toISOString(),

    service: 'teaching-yoga-video-worker',

    event: 'video_worker_bootstrap_failed',

    error: {
      name: error?.name || 'Error',

      message: error?.message || String(error),

      stack: error?.stack || null,
    },
  };

  process.stderr.write(`${JSON.stringify(payload)}\n`);

  process.exitCode = 1;
});
