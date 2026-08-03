import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { normalizeStorageKey } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ACCESS_LEVELS = new Set(['PUBLIC', 'REGISTERED', 'PURCHASED']);

class SessionVideoError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = 'SessionVideoError';
    this.status = status;
  }
}

const isAbsoluteHttpUrl = (value) => {
  return /^https?:\/\//i.test(String(value || ''));
};

const normalizeSessionId = (value) => {
  const sessionId = typeof value === 'string' ? value.trim() : '';

  if (!sessionId) {
    throw new SessionVideoError('شناسه جلسه ارسال نشده است.');
  }

  return sessionId;
};

const normalizeOptionalVideoId = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const videoId =
    typeof value === 'string' ? value.trim() : String(value).trim();

  if (!videoId) {
    throw new SessionVideoError('شناسه ویدئو معتبر نیست.');
  }

  return videoId;
};

const normalizeAccessLevel = (value) => {
  const accessLevel =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (!VALID_ACCESS_LEVELS.has(accessLevel)) {
    throw new SessionVideoError('سطح دسترسی ویدئو معتبر نیست.');
  }

  return accessLevel;
};

const normalizeVideoKey = (value) => {
  const videoKey = typeof value === 'string' ? value.trim() : '';

  if (!videoKey) {
    throw new SessionVideoError('مسیر ویدئو ارسال نشده است.');
  }

  /*
   * فقط برای سازگاری با داده‌های قدیمی پیش از مهاجرت.
   */
  if (isAbsoluteHttpUrl(videoKey)) {
    return videoKey;
  }

  let normalizedKey;

  try {
    normalizedKey = normalizeStorageKey(videoKey);
  } catch {
    throw new SessionVideoError('مسیر ویدئو معتبر نیست.');
  }

  const rootDirectory = normalizedKey.split('/')[0];

  if (rootDirectory !== 'videos') {
    throw new SessionVideoError(
      'ویدئوی جلسه باید در مسیر videos ذخیره شده باشد.'
    );
  }

  return normalizedKey;
};

const publishSessionVideo = async ({
  sessionId,
  requestedVideoId,
  videoKey,
  accessLevel,
}) => {
  return prismadb.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: {
        id: sessionId,
      },

      select: {
        id: true,
        videoId: true,
      },
    });

    if (!session) {
      throw new SessionVideoError('جلسه موردنظر پیدا نشد.', 404);
    }

    /*
     * در PUT شناسه صریح Video اولویت دارد.
     * در POST، اگر Session از قبل Video داشته باشد
     * همان رکورد Update می‌شود تا رکورد Orphan نسازیم.
     */
    const targetVideoId = requestedVideoId || session.videoId || null;

    let sessionVideo;
    let mutationType;

    if (targetVideoId) {
      const existingVideo = await tx.sessionVideo.findUnique({
        where: {
          id: targetVideoId,
        },

        select: {
          id: true,
        },
      });

      if (!existingVideo) {
        throw new SessionVideoError('رکورد ویدئوی موردنظر پیدا نشد.', 404);
      }

      sessionVideo = await tx.sessionVideo.update({
        where: {
          id: targetVideoId,
        },

        data: {
          videoKey,
          accessLevel,
          status: 'AVAILABLE',
        },
      });

      mutationType = 'UPDATED';
    } else {
      sessionVideo = await tx.sessionVideo.create({
        data: {
          videoKey,
          accessLevel,
          status: 'AVAILABLE',
        },
      });

      mutationType = 'CREATED';
    }

    const updatedSession = await tx.session.update({
      where: {
        id: session.id,
      },

      data: {
        videoId: sessionVideo.id,

        type: 'VIDEO',
        isActive: true,
      },

      select: {
        id: true,
        audioId: true,
        videoId: true,
        type: true,
        isActive: true,
      },
    });

    return {
      video: sessionVideo,
      session: updatedSession,
      mutationType,
    };
  });
};

const handleMutation = async (request, httpMethod) => {
  let log = getRequestLogger({
    component: 'session-video-mutation',

    mutationMethod: httpMethod,
  });

  let sessionId = null;
  let requestedVideoId = null;
  let accessLevel = null;
  let storageKind = null;
  let localStorageKey = null;

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    log = log.child({
      actorUserId: auth.user.id,
      actorRole: auth.user.role,
    });

    const body = await request.json();

    sessionId = normalizeSessionId(body?.sessionId);

    accessLevel = normalizeAccessLevel(body?.accessLevel);

    const videoKey = normalizeVideoKey(body?.videoKey);

    requestedVideoId = normalizeOptionalVideoId(body?.videoId);

    if (httpMethod === 'PUT' && !requestedVideoId) {
      throw new SessionVideoError('شناسه ویدئو برای ویرایش الزامی است.');
    }

    storageKind = isAbsoluteHttpUrl(videoKey) ? 'LEGACY_EXTERNAL' : 'LOCAL';

    localStorageKey = storageKind === 'LOCAL' ? videoKey : null;

    log = log.child({
      sessionId,
      videoId: requestedVideoId,
      mediaType: 'VIDEO',
      accessLevel,
      storageKind,
    });

    log.info(
      {
        event: 'session_video_publish_started',

        storageKey: localStorageKey,
      },
      'Session video publish started'
    );

    const result = await publishSessionVideo({
      sessionId,
      requestedVideoId,
      videoKey,
      accessLevel,
    });

    log.info(
      {
        event: 'session_video_published',

        videoId: result.video.id,

        mutationType: result.mutationType,

        sessionActive: result.session.isActive,
      },
      'Session video published successfully'
    );

    /*
     * شکل پاسخ‌های قبلی برای جلوگیری از شکستن
     * کلاینت‌های فعلی حفظ شده است.
     */
    if (httpMethod === 'POST') {
      return NextResponse.json(
        {
          success: true,

          newSessionVideo: result.video,

          session: result.session,
        },
        {
          status: result.mutationType === 'CREATED' ? 201 : 200,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        updatedVideo: result.video,

        session: result.session,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      log.warn(
        {
          event: 'session_video_publish_rejected',

          status: 400,
          reason: 'INVALID_JSON',
        },
        'Session video request body was invalid'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'بدنه درخواست معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    if (error instanceof SessionVideoError) {
      log.warn(
        {
          event: 'session_video_publish_rejected',

          status: error.status,
          reason: error.message,

          sessionId,
          videoId: requestedVideoId,
          accessLevel,
          storageKind,
        },
        'Session video publish was rejected'
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: error.status,
        }
      );
    }

    logError({
      log,
      error,

      message: 'Session video publish failed',

      data: {
        event: 'session_video_publish_failed',

        sessionId,
        videoId: requestedVideoId,
        accessLevel,
        storageKind,

        storageKey: localStorageKey,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در ذخیره اطلاعات ویدئو.',
      },
      {
        status: 500,
      }
    );
  }
};

const handlePost = (request) => {
  return handleMutation(request, 'POST');
};

const handlePut = (request) => {
  return handleMutation(request, 'PUT');
};

export const POST = withApiLogging(handlePost, {
  route: '/api/session-video',

  component: 'session-video-api',
});

export const PUT = withApiLogging(handlePut, {
  route: '/api/session-video',

  component: 'session-video-api',
});
