/* eslint-disable no-undef */
import dotenv from 'dotenv';

dotenv.config();

const abortController = new AbortController();

let shuttingDown = false;
let fatalError = false;

const requestShutdown = (reason, options = {}) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  fatalError = options.fatal === true;

  console.log(`[video-worker] Shutdown requested: ${reason}`);

  abortController.abort();
};

process.on('SIGINT', () => {
  requestShutdown('SIGINT');
});

process.on('SIGTERM', () => {
  requestShutdown('SIGTERM');
});

process.on('unhandledRejection', (error) => {
  console.error('[video-worker] Unhandled promise rejection:', error);

  requestShutdown('unhandledRejection', {
    fatal: true,
  });
});

process.on('uncaughtException', (error) => {
  console.error('[video-worker] Uncaught exception:', error);

  requestShutdown('uncaughtException', {
    fatal: true,
  });
});

async function main() {
  let prismadb;

  try {
    const [{ runVideoWorker }, prismaModule] = await Promise.all([
      import('../src/server/video/worker/run-video-worker.js'),
      import('../libs/prismadb.js'),
    ]);

    prismadb = prismaModule.default;

    await runVideoWorker({
      signal: abortController.signal,
    });
  } catch (error) {
    fatalError = true;

    console.error(
      '[video-worker] Fatal worker error:',
      error instanceof Error ? error.stack || error.message : error
    );
  } finally {
    if (prismadb) {
      console.log('[video-worker] Closing database connection...');

      await prismadb.$disconnect().catch((error) => {
        fatalError = true;

        console.error('[video-worker] Prisma disconnect error:', error);
      });
    }

    console.log('[video-worker] Worker stopped.');

    if (fatalError) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(
    '[video-worker] Startup error:',
    error instanceof Error ? error.stack || error.message : error
  );

  process.exitCode = 1;
});
