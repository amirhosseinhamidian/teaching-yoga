import path from 'node:path';
import { NextResponse } from 'next/server';
import { authorizeSessionMedia } from '@/server/media/session-media-access';
import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';
import { withApiLogging } from '@/server/logger/with-api-logging';

import {
  createProtectedSessionMediaUrl,
  createSessionMediaToken,
} from '@/server/media/session-media-token';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const createErrorResponse = (result) =>
  NextResponse.json(
    {
      success: false,
      error: result.message,
      code: result.code,
    },
    {
      status: result.status,

      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );

async function handleGet(request) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();

  const log = getRequestLogger({
    component: 'lesson-api',

    sessionId: sessionId || null,
  });

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: 'شناسه جلسه معتبر نیست.',
      },
      {
        status: 400,
      }
    );
  }

  try {
    const access = await authorizeSessionMedia(sessionId);

    if (!access.ok) {
      const logMethod =
        access.status >= 500
          ? 'error'
          : access.status === 401 || access.status === 403
            ? 'warn'
            : 'info';

      log[logMethod](
        {
          event: 'session_media_access_denied',

          status: access.status,

          code: access.code,
        },

        'Session media access was denied'
      );

      return createErrorResponse(access);
    }

    const token = await createSessionMediaToken({
      sessionId: access.session.id,

      mediaType: access.mediaType,

      mediaId: access.mediaId,

      storageKey: access.storageKey,

      userId: access.user?.id || null,

      accessLevel: access.accessLevel,
    });

    const initialAssetPath =
      access.mediaType === 'VIDEO'
        ? path.posix.basename(access.storageKey)
        : null;

    const mediaLink = createProtectedSessionMediaUrl({
      sessionId: access.session.id,

      mediaType: access.mediaType,

      token,

      assetPath: initialAssetPath,
    });

    log.info(
      {
        event: 'session_media_token_issued',

        mediaType: access.mediaType,

        mediaId: access.mediaId,

        accessLevel: access.accessLevel,

        accessReason: access.accessReason,

        userId: access.user?.id || null,
      },

      'Protected session media URL issued'
    );

    const firstTerm = access.terms[0] || null;

    const session = access.session;

    return NextResponse.json(
      {
        success: true,

        id: session.id,

        name: session.name,

        duration: session.duration,

        isFree: session.isFree,

        type: session.type,

        term: firstTerm
          ? {
              id: firstTerm.id,

              name: firstTerm.name,
            }
          : null,

        mediaType: access.mediaType,

        mediaLink,

        accessLevel: access.accessLevel,

        /*
         * کلید واقعی Storage دیگر به مرورگر
         * ارسال نمی‌شود.
         */
        video:
          access.mediaType === 'VIDEO'
            ? {
                id: access.mediaId,

                accessLevel: access.accessLevel,

                status: session.video?.status || null,
              }
            : null,

        audio:
          access.mediaType === 'AUDIO'
            ? {
                id: access.mediaId,

                accessLevel: access.accessLevel,

                status: session.audio?.status || null,
              }
            : null,
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    logError({
      log,
      error,

      message: 'Lesson protected media request failed',

      data: {
        event: 'lesson_protected_media_failed',

        sessionId: sessionId || null,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت اطلاعات جلسه.',
      },
      {
        status: 500,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

export const GET = withApiLogging(handleGet, {
  route: '/api/lesson',

  component: 'lesson-api',
});
