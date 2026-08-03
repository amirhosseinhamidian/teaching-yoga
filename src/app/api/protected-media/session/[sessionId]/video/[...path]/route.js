import { logError } from '@/server/logger';

import { runWithRequestContext } from '@/server/logger/request-context';

import {
  isExpectedMediaAccessError,
  isManifestAsset,
  isMissingMediaError,
} from '@/server/media/media-logger';

import { verifySessionMediaToken } from '@/server/media/session-media-token';

import {
  resolveVideoAssetStorageKey,
  serveProtectedMedia,
} from '@/server/media/protected-media-delivery';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const getRequestData = async (request, context) => {
  const params = await context.params;

  const sessionId =
    typeof params?.sessionId === 'string' ? params.sessionId.trim() : '';

  const assetSegments = Array.isArray(params?.path) ? params.path : [];

  const assetPath = assetSegments.join('/');

  const token = request.nextUrl.searchParams.get('token');

  return {
    sessionId,
    assetPath,
    token,
  };
};

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
      let assetPath = '';

      try {
        const requestData = await getRequestData(request, context);

        sessionId = requestData.sessionId;

        assetPath = requestData.assetPath;

        const token = requestData.token;

        const log = logger.child({
          sessionId: sessionId || null,

          mediaType: 'VIDEO',

          assetPath: assetPath || null,
        });

        if (!sessionId || !assetPath) {
          log.debug(
            {
              event: 'protected_video_invalid_path',
            },

            'Protected video path was invalid'
          );

          return createErrorResponse({
            status: 404,
            requestId,
          });
        }

        if (!token) {
          log.warn(
            {
              event: 'protected_video_token_missing',
            },

            'Protected video token was missing'
          );

          return createErrorResponse({
            status: 401,
            requestId,
          });
        }

        const verified = await verifySessionMediaToken({
          token,
          sessionId,
          mediaType: 'VIDEO',
        });

        const storageKey = resolveVideoAssetStorageKey({
          masterStorageKey: verified.storageKey,

          assetPath,
        });

        const response = await serveProtectedMedia({
          request,
          storageKey,
          includeBody,

          manifestContext: {
            sessionId,
            token,

            currentAssetPath: assetPath,
          },
        });

        /*
         * فقط Manifest را در سطح info ثبت می‌کنیم.
         * ثبت تمام Segmentهای HLS باعث انفجار حجم لاگ می‌شود.
         */
        if (isManifestAsset(assetPath)) {
          log.info(
            {
              event: 'protected_video_manifest_served',

              status: response.status,

              durationMs: Number((performance.now() - startedAt).toFixed(1)),
            },

            'Protected HLS manifest served'
          );
        }

        return attachRequestId(response, requestId);
      } catch (error) {
        const log = logger.child({
          sessionId: sessionId || null,

          mediaType: 'VIDEO',

          assetPath: assetPath || null,
        });

        if (isMissingMediaError(error)) {
          const logMethod = isManifestAsset(assetPath) ? 'warn' : 'debug';

          log[logMethod](
            {
              event: 'protected_video_file_missing',

              errorCode: error?.code || null,
            },

            'Protected video file was not found'
          );

          return createErrorResponse({
            status: 404,
            requestId,
          });
        }

        if (isExpectedMediaAccessError(error)) {
          log.warn(
            {
              event: 'protected_video_access_denied',

              errorCode: error?.code || null,

              reason: error?.message || 'INVALID_MEDIA_TOKEN',
            },

            'Protected video access was denied'
          );

          return createErrorResponse({
            status: 403,
            requestId,
          });
        }

        logError({
          log,
          error,

          message: 'Protected video delivery failed',

          data: {
            event: 'protected_video_delivery_failed',

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
      component: 'protected-video-route',

      route: '/api/protected-media/session/[sessionId]/video/[...path]',
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
