import { runWithRequestContext } from './request-context';

const getDurationMs = (startedAt) => {
  return Number((performance.now() - startedAt).toFixed(1));
};

const addRequestIdHeader = (response, requestId) => {
  try {
    if (response?.headers && typeof response.headers.set === 'function') {
      response.headers.set('x-request-id', requestId);
    }
  } catch {
    // بعضی Responseها Header غیرقابل تغییر دارند.
  }

  return response;
};

export const withApiLogging = (
  handler,
  {
    route = 'unknown-api-route',
    component = 'api',

    /*
     * برای APIهای Polling می‌توان لاگ درخواست‌های موفق
     * را غیرفعال کرد، ولی 4xx و 5xx همچنان ثبت می‌شوند.
     */
    logSuccess = true,
  } = {}
) => {
  return async function loggedApiHandler(request, ...args) {
    return runWithRequestContext(
      request,

      async ({ logger, requestId }) => {
        const startedAt = performance.now();

        try {
          const response = await handler(request, ...args);

          const status = Number(response?.status) || 200;

          const durationMs = getDurationMs(startedAt);

          if (status >= 500) {
            logger.error(
              {
                event: 'http_request_completed',
                route,
                status,
                durationMs,
              },
              'HTTP request completed with server error'
            );
          } else if (status >= 400) {
            logger.warn(
              {
                event: 'http_request_completed',
                route,
                status,
                durationMs,
              },
              'HTTP request completed with client error'
            );
          } else if (logSuccess) {
            logger.info(
              {
                event: 'http_request_completed',
                route,
                status,
                durationMs,
              },
              'HTTP request completed'
            );
          }

          return addRequestIdHeader(response, requestId);
        } catch (error) {
          logger.error(
            {
              event: 'http_request_unhandled_error',
              route,
              durationMs: getDurationMs(startedAt),
              error,
            },
            'Unhandled API route error'
          );

          throw error;
        }
      },

      {
        route,
        component,
      }
    );
  };
};

export default withApiLogging;
