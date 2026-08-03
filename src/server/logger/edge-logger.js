const LEVEL_PRIORITY = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const getConfiguredLevel = () => {
  const level = String(
    process.env.EDGE_LOG_LEVEL || process.env.LOG_LEVEL || ''
  )
    .trim()
    .toLowerCase();

  if (Object.hasOwn(LEVEL_PRIORITY, level)) {
    return level;
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const sanitizeError = (error) => {
  if (!(error instanceof Error)) {
    return {
      name: 'NonErrorThrown',

      message: String(error),
    };
  }

  return {
    name: error.name,

    message: error.message,

    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  };
};

const sanitizeValue = (value, depth = 0) => {
  if (depth > 4) {
    return '[MaxDepth]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Error) {
    return sanitizeError(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (
        /token|cookie|authorization|phone|email|secret|code|state|verifier/i.test(
          key
        )
      ) {
        result[key] = '[REDACTED]';

        continue;
      }

      result[key] = sanitizeValue(nestedValue, depth + 1);
    }

    return result;
  }

  if (typeof value === 'string') {
    return value.length > 2000 ? `${value.slice(0, 2000)}…[truncated]` : value;
  }

  return value;
};

const shouldLog = (level) => {
  const configured = getConfiguredLevel();

  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[configured];
};

const writeLog = (level, bindings, data, message) => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,

    time: new Date().toISOString(),

    service: process.env.LOG_SERVICE || 'teaching-yoga-web',

    environment: process.env.NODE_ENV || 'development',

    runtime: 'edge',

    ...sanitizeValue(bindings),

    ...sanitizeValue(data),

    message,
  };

  const serialized = JSON.stringify(payload);

  switch (level) {
    case 'error':
      console.error(serialized);
      break;

    case 'warn':
      console.warn(serialized);
      break;

    case 'info':
      console.info(serialized);
      break;

    default:
      console.debug(serialized);
  }
};

export const createEdgeLogger = (bindings = {}) => {
  return {
    child(childBindings = {}) {
      return createEdgeLogger({
        ...bindings,
        ...childBindings,
      });
    },

    debug(data, message) {
      writeLog('debug', bindings, data, message);
    },

    info(data, message) {
      writeLog('info', bindings, data, message);
    },

    warn(data, message) {
      writeLog('warn', bindings, data, message);
    },

    error(data, message) {
      writeLog('error', bindings, data, message);
    },
  };
};

export const edgeLogger = createEdgeLogger({
  component: 'middleware',
});
