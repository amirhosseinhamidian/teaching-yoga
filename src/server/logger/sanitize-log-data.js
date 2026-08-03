const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_ARRAY_LENGTH = 50;
const DEFAULT_MAX_STRING_LENGTH = 4000;

const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|authorization|cookie|otp|verification|api[-_]?key|private[-_]?key|merchant|authority|ref[-_]?id|transaction[-_]?id|card|pan|cvv|iban|phone|mobile|email|address|postal/i;

const REDACTED_VALUE = '[REDACTED]';

const truncateString = (value, maxLength = DEFAULT_MAX_STRING_LENGTH) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}…[truncated]`;
};

const normalizeError = (error, depth, seen) => {
  const normalized = {
    name: error.name || 'Error',
    message: truncateString(String(error.message || 'Unknown error')),
  };

  if (error.stack) {
    normalized.stack = truncateString(String(error.stack), 12000);
  }

  if (error.code !== undefined) {
    normalized.code = String(error.code);
  }

  if (error.status !== undefined) {
    normalized.status = error.status;
  }

  if (error.statusCode !== undefined) {
    normalized.statusCode = error.statusCode;
  }

  if (error.cause && depth < DEFAULT_MAX_DEPTH) {
    normalized.cause = sanitizeValue(error.cause, depth + 1, seen);
  }

  return normalized;
};

const sanitizeObject = (value, depth, seen) => {
  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  const result = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = REDACTED_VALUE;
      continue;
    }

    result[key] = sanitizeValue(nestedValue, depth + 1, seen);
  }

  seen.delete(value);

  return result;
};

const sanitizeValue = (value, depth, seen) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (depth > DEFAULT_MAX_DEPTH) {
    return '[MaxDepth]';
  }

  if (value instanceof Error) {
    return normalizeError(value, depth, seen);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return `[Buffer:${value.length}]`;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'function') {
    return `[Function:${value.name || 'anonymous'}]`;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, DEFAULT_MAX_ARRAY_LENGTH)
      .map((item) => sanitizeValue(item, depth + 1, seen));
  }

  if (typeof value === 'object') {
    return sanitizeObject(value, depth, seen);
  }

  return String(value);
};

export const sanitizeLogData = (value) => {
  return sanitizeValue(value, 0, new WeakSet());
};

export const sanitizeError = (error) => {
  if (error instanceof Error) {
    return sanitizeLogData(error);
  }

  return {
    name: 'NonErrorThrown',
    message:
      typeof error === 'string'
        ? truncateString(error)
        : 'A non-Error value was thrown.',
    value: sanitizeLogData(error),
  };
};
