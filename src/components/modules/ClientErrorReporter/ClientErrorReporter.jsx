'use client';

import { useEffect } from 'react';

import { reportClientError } from '@/utils/reportClientError';

const DEDUPE_WINDOW_MS = 30 * 1000;

const reportedErrors = new Map();

const stripQueryAndHash = (value) => {
  try {
    const url = new URL(value, window.location.origin);

    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
};

const shouldReport = (fingerprint) => {
  const now = Date.now();

  for (const [key, createdAt] of reportedErrors) {
    if (now - createdAt > DEDUPE_WINDOW_MS) {
      reportedErrors.delete(key);
    }
  }

  if (reportedErrors.has(fingerprint)) {
    return false;
  }

  reportedErrors.set(fingerprint, now);

  return true;
};

const ClientErrorReporter = () => {
  useEffect(() => {
    const handleWindowError = (event) => {
      if (event.error) {
        const fingerprint = [
          event.error.name,
          event.error.message,
          event.filename,
          event.lineno,
          event.colno,
        ].join('|');

        if (shouldReport(fingerprint)) {
          reportClientError(event.error, {
            type: 'window_error',

            source: event.filename,
          });
        }

        return;
      }

      const target = event.target;

      const resourceUrl = target?.src || target?.href || null;

      if (!resourceUrl) {
        return;
      }

      const safeResourceUrl = stripQueryAndHash(resourceUrl);

      const fingerprint = `resource:${safeResourceUrl}`;

      if (shouldReport(fingerprint)) {
        reportClientError(
          new Error('Client resource failed to load.'),

          {
            type: 'resource_error',

            resourceUrl: safeResourceUrl,
          }
        );
      }
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason;

      if (reason?.name === 'AbortError') {
        return;
      }

      const message = reason instanceof Error ? reason.message : String(reason);

      const fingerprint = `promise:${message}`;

      if (shouldReport(fingerprint)) {
        reportClientError(
          reason,

          {
            type: 'unhandled_rejection',
          }
        );
      }
    };

    window.addEventListener('error', handleWindowError, true);

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError, true);

      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  return null;
};

export default ClientErrorReporter;
