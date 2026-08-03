import os from 'node:os';

import pino from 'pino';

import { sanitizeError, sanitizeLogData } from './sanitize-log-data';

const ROOT_LOGGER_KEY = Symbol.for('teaching-yoga.root-logger');

const getLogLevel = () => {
  const configuredLevel = String(process.env.LOG_LEVEL || '')
    .trim()
    .toLowerCase();

  const allowedLevels = new Set([
    'trace',
    'debug',
    'info',
    'warn',
    'error',
    'fatal',
    'silent',
  ]);

  if (allowedLevels.has(configuredLevel)) {
    return configuredLevel;
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const createRootLogger = () =>
  pino({
    level: getLogLevel(),

    messageKey: 'message',

    timestamp: pino.stdTimeFunctions.isoTime,

    base: {
      pid: process.pid,
      hostname: os.hostname(),

      service: process.env.LOG_SERVICE || 'teaching-yoga-web',

      environment: process.env.NODE_ENV || 'development',

      version: process.env.npm_package_version || 'unknown',
    },

    formatters: {
      level(label) {
        return {
          level: label,
        };
      },
    },

    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },

    redact: {
      paths: [
        'password',
        'secret',
        'token',
        'accessToken',
        'refreshToken',
        'authorization',
        'cookie',
        'otp',
        'phone',
        'mobile',
        'email',
        'authority',
        'refId',
        'ref_id',
        'transactionId',
        'merchantId',
        'merchant_id',
        'cardPan',
        'card_pan',
        'cardHash',
        'card_hash',

        'data.authority',
        'data.refId',
        'data.ref_id',
        'data.transactionId',
        'data.card_pan',
        'data.card_hash',

        'body.authority',
        'body.refId',
        'body.ref_id',
        'body.transactionId',
        'body.card_pan',
        'body.card_hash',

        'req.headers.authorization',
        'req.headers.cookie',

        'headers.authorization',
        'headers.cookie',

        'body.password',
        'body.token',
        'body.otp',
        'body.phone',
        'body.mobile',
        'body.email',
      ],

      censor: '[REDACTED]',
    },
  });

if (!globalThis[ROOT_LOGGER_KEY]) {
  globalThis[ROOT_LOGGER_KEY] = createRootLogger();
}

export const logger = globalThis[ROOT_LOGGER_KEY];

export const createChildLogger = (bindings = {}) => {
  return logger.child(sanitizeLogData(bindings));
};

export const logError = ({
  log = logger,
  error,
  message = 'Application error',
  data = {},
}) => {
  log.error(
    {
      ...sanitizeLogData(data),
      error: sanitizeError(error),
    },
    message
  );
};

export const logFatal = ({
  log = logger,
  error,
  message = 'Fatal application error',
  data = {},
}) => {
  log.fatal(
    {
      ...sanitizeLogData(data),
      error: sanitizeError(error),
    },
    message
  );
};

export default logger;
