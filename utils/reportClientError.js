'use client';

const REPORT_ENDPOINT = '/api/client-error';

const DEDUPLICATION_WINDOW_MS = 10_000;

const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LENGTH = 5000;
const MAX_DATA_DEPTH = 4;
const MAX_ARRAY_LENGTH = 20;

const recentReports = new Map();

const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|authorization|cookie|otp|verification|merchant|authority|transaction|ref[-_]?id|card|pan|cvv|iban|phone|mobile|email|address|postal/i;

const normalizeText = (value, maxLength) => {
  return String(value ?? '')
    .normalize('NFC')
    .trim()
    .slice(0, maxLength);
};

const sanitizeText = (value, maxLength = MAX_MESSAGE_LENGTH) => {
  return normalizeText(value, maxLength)
    .replace(/https?:\/\/[^\s?#]+(?:\?[^\s#]*)?/gi, '[URL]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[JWT]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/(?:\+98|0098|98|0)?9\d{9}\b/g, '[PHONE]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[NUMBER]');
};

const sanitizeValue = (value, depth = 0, seen = new WeakSet()) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth > MAX_DATA_DEPTH) {
    return '[MaxDepth]';
  }

  if (value instanceof Error) {
    return {
      name: sanitizeText(value.name || 'Error', 100),
      message: sanitizeText(value.message),
    };
  }

  if (typeof value === 'string') {
    return sanitizeText(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, depth + 1, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);

    const result = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        result[key] = '[REDACTED]';
        continue;
      }

      result[key] = sanitizeValue(nestedValue, depth + 1, seen);
    }

    seen.delete(value);

    return result;
  }

  return sanitizeText(value);
};

const normalizeError = (error) => {
  if (error instanceof Error) {
    return {
      name: sanitizeText(error.name || 'Error', 100),

      message: sanitizeText(error.message || 'Unknown client error'),

      stack: error.stack ? sanitizeText(error.stack, MAX_STACK_LENGTH) : null,
    };
  }

  return {
    name: 'ClientError',

    message: sanitizeText(error || 'Unknown client error'),

    stack: null,
  };
};

const getClientPath = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  /*
   * Search params عمداً ارسال نمی‌شوند؛
   * ممکن است شامل Payment token یا داده حساس باشند.
   */
  return sanitizeText(window.location.pathname, 500);
};

const createFingerprint = ({ event, component, error }) => {
  return [event, component, error.name, error.message].join(':');
};

const shouldSkipDuplicate = (fingerprint) => {
  const now = Date.now();

  const previous = recentReports.get(fingerprint);

  if (previous && now - previous < DEDUPLICATION_WINDOW_MS) {
    return true;
  }

  recentReports.set(fingerprint, now);

  for (const [key, timestamp] of recentReports) {
    if (now - timestamp > DEDUPLICATION_WINDOW_MS) {
      recentReports.delete(key);
    }
  }

  return false;
};

const normalizeArguments = (input, options) => {
  if (input instanceof Error || typeof input === 'string') {
    return {
      error: input,
      ...(options || {}),
    };
  }

  return {
    ...(input || {}),
  };
};

export const reportClientError = (input, options = {}) => {
  const config = normalizeArguments(input, options);

  const error = normalizeError(config.error);

  if (error.name === 'AbortError') {
    return;
  }

  const event =
    sanitizeText(config.event || 'client_error', 120) || 'client_error';

  const component =
    sanitizeText(config.component || 'unknown-client-component', 120) ||
    'unknown-client-component';

  const severity = config.severity === 'warn' ? 'warn' : 'error';

  const payload = {
    event,
    component,
    severity,

    error,

    path: getClientPath(),

    data: sanitizeValue(config.data || {}),
  };

  const fingerprint = createFingerprint({
    event,
    component,
    error,
  });

  if (shouldSkipDuplicate(fingerprint)) {
    return;
  }

  /*
   * Reporter نباید خودش باعث خطای جدید در UI شود.
   */
  fetch(REPORT_ENDPOINT, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',

      Accept: 'application/json',
    },

    credentials: 'same-origin',

    cache: 'no-store',

    keepalive: true,

    body: JSON.stringify(payload),
  }).catch(() => {});
};

export default reportClientError;
