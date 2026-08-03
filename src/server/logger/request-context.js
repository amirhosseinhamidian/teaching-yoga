import { randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

import { createChildLogger, logger } from './index';

const STORAGE_KEY = Symbol.for('teaching-yoga.request-log-storage');

if (!globalThis[STORAGE_KEY]) {
  globalThis[STORAGE_KEY] = new AsyncLocalStorage();
}

const requestStorage = globalThis[STORAGE_KEY];

const normalizeRequestId = (value) => {
  const requestId = typeof value === 'string' ? value.trim() : '';

  if (requestId && requestId.length <= 128) {
    return requestId;
  }

  return randomUUID();
};

const getRequestPath = (request) => {
  try {
    return new URL(request.url).pathname;
  } catch {
    return 'unknown';
  }
};

export const runWithRequestContext = (request, callback, bindings = {}) => {
  const requestId = normalizeRequestId(request.headers.get('x-request-id'));

  const method = request.method || 'UNKNOWN';

  const path = getRequestPath(request);

  const requestLogger = createChildLogger({
    requestId,
    method,
    path,
    ...bindings,
  });

  return requestStorage.run(
    {
      requestId,
      method,
      path,
      logger: requestLogger,
    },
    () =>
      callback({
        requestId,
        method,
        path,
        logger: requestLogger,
      })
  );
};

export const getRequestContext = () => {
  return requestStorage.getStore() || null;
};

export const getRequestLogger = (bindings = {}) => {
  const activeLogger = getRequestContext()?.logger || logger;

  if (!bindings || Object.keys(bindings).length === 0) {
    return activeLogger;
  }

  return activeLogger.child(bindings);
};

export const getRequestId = () => {
  return getRequestContext()?.requestId || null;
};
