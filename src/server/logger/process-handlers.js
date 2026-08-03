/* eslint-disable no-undef */
import { logger, logFatal } from './index';

const INSTALLATION_KEY = Symbol.for('teaching-yoga.process-error-handlers');

const normalizeThrownValue = (value) => {
  if (value instanceof Error) {
    return value;
  }

  let message;

  try {
    message = typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    message = 'Unknown non-Error value';
  }

  return new Error(message);
};

const shouldExitOnFatal = () => {
  const configured = process.env.LOG_EXIT_ON_FATAL;

  if (configured === 'true') {
    return true;
  }

  if (configured === 'false') {
    return false;
  }

  return process.env.NODE_ENV === 'production';
};

const scheduleFatalExit = () => {
  if (!shouldExitOnFatal()) {
    return;
  }

  process.exitCode = 1;

  setTimeout(() => {
    process.exit(1);
  }, 250);
};

export const installProcessErrorHandlers = ({
  service = 'teaching-yoga-web',
} = {}) => {
  if (globalThis[INSTALLATION_KEY]) {
    return;
  }

  globalThis[INSTALLATION_KEY] = true;

  const processLogger = logger.child({
    service,
    component: 'process',
  });

  process.on('unhandledRejection', (reason) => {
    logFatal({
      log: processLogger,

      error: normalizeThrownValue(reason),

      message: 'Unhandled promise rejection',

      data: {
        event: 'unhandled_rejection',
      },
    });

    scheduleFatalExit();
  });

  process.on('uncaughtException', (error) => {
    logFatal({
      log: processLogger,

      error,

      message: 'Uncaught exception',

      data: {
        event: 'uncaught_exception',
      },
    });

    scheduleFatalExit();
  });

  processLogger.info(
    {
      event: 'process_error_handlers_installed',
    },

    'Process error handlers installed'
  );
};
