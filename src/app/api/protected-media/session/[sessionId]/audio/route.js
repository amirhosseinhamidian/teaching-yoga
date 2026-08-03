import { logError } from '@/server/logger';

import { runWithRequestContext } from '@/server/logger/request-context';

import {
  isExpectedMediaAccessError,
  isMissingMediaError,
} from '@/server/media/media-logger';

import { verifySessionMediaToken } from '@/server/media/session-media-token';

import { serveProtectedMedia } from '@/server/media/protected-media-delivery';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const attachRequestId = (response, requestId) => {
  try {
    response.headers.set('x-request-id', requestId);
  } catch {
    // Response غیرقابل تغییر
  }

  return response;
};

const createErrorResponse = ({ status, requestId }) => {
  const response = new Response(
    status === 404
      ? 'File not found.'
      : status === 401
        ? 'Authentication required.'
        : 'Access denied.',
    {
      status,

      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );

  return attachRequestId(response, requestId);
};

const handleRequest = async ({ request, context, includeBody }) => {
  return runWithRequestContext(
    request,

    async ({ logger, requestId }) => {
      const startedAt = performance.now();

      let sessionId = '';

      try {
        const params = await context.params;

        sessionId =
          typeof params?.sessionId === 'string' ? params.sessionId.trim() : '';

        const token = request.nextUrl.searchParams.get('token');

        const log = logger.child({
          sessionId: sessionId || null,

          mediaType: 'AUDIO',
        });

        if (!sessionId) {
          log.debug(
            {
              event: 'protected_audio_invalid_session',
            },

            'Protected audio session ID was invalid'
          );

          return createErrorResponse({
            status: 404,
            requestId,
          });
        }

        if (!token) {
          log.warn(
            {
              event: 'protected_audio_token_missing',
            },

            'Protected audio token was missing'
          );

          return createErrorResponse({
            status: 401,
            requestId,
          });
        }

        const verified = await verifySessionMediaToken({
          token,
          sessionId,
          mediaType: 'AUDIO',
        });

        const response = await serveProtectedMedia({
          request,

          storageKey: verified.storageKey,

          includeBody,
        });

        const isRangeRequest = Boolean(request.headers.get('range'));

        /*
         * Range Requestها ممکن است متعدد باشند.
         * اولین درخواست کامل info و Rangeها debug هستند.
         */
        const logMethod = isRangeRequest ? 'debug' : 'info';

        log[logMethod](
          {
            event: 'protected_audio_served',

            status: response.status,

            isRangeRequest,

            durationMs: Number((performance.now() - startedAt).toFixed(1)),
          },

          'Protected audio served'
        );

        return attachRequestId(response, requestId);
      } catch (error) {
        const log = logger.child({
          sessionId: sessionId || null,

          mediaType: 'AUDIO',
        });

        if (isMissingMediaError(error)) {
          log.warn(
            {
              event: 'protected_audio_file_missing',

              errorCode: error?.code || null,
            },

            'Protected audio file was not found'
          );

          return createErrorResponse({
            status: 404,
            requestId,
          });
        }

        if (isExpectedMediaAccessError(error)) {
          log.warn(
            {
              event: 'protected_audio_access_denied',

              errorCode: error?.code || null,

              reason: error?.message || 'INVALID_MEDIA_TOKEN',
            },

            'Protected audio access was denied'
          );

          return createErrorResponse({
            status: 403,
            requestId,
          });
        }

        logError({
          log,
          error,

          message: 'Protected audio delivery failed',

          data: {
            event: 'protected_audio_delivery_failed',

            durationMs: Number((performance.now() - startedAt).toFixed(1)),
          },
        });

        return createErrorResponse({
          status: 500,
          requestId,
        });
      }
    },

    {
      component: 'protected-audio-route',

      route: '/api/protected-media/session/[sessionId]/audio',
    }
  );
};

export async function GET(request, context) {
  return handleRequest({
    request,
    context,
    includeBody: true,
  });
}

export async function HEAD(request, context) {
  return handleRequest({
    request,
    context,
    includeBody: false,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,

    headers: {
      Allow: 'GET, HEAD, OPTIONS',

      'Cache-Control': 'no-store',
    },
  });
}
