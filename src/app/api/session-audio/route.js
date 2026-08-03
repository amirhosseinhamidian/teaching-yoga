import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getMediaStorage, normalizeStorageKey } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ACCESS_LEVELS = new Set(['PUBLIC', 'REGISTERED', 'PURCHASED']);

class SessionAudioError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = 'SessionAudioError';
    this.status = status;
  }
}

const isAbsoluteHttpUrl = (value) => {
  return /^https?:\/\//i.test(String(value || ''));
};

const normalizeAudioKey = (value) => {
  const audioKey = typeof value === 'string' ? value.trim() : '';

  if (!audioKey) {
    throw new SessionAudioError('مسیر فایل صوتی ارسال نشده است.');
  }

  /*
   * برای سازگاری موقت با فایل‌های قدیمی S3،
   * URLهای کامل همچنان پذیرفته می‌شوند.
   */
  if (isAbsoluteHttpUrl(audioKey)) {
    return audioKey;
  }

  let normalizedKey;

  try {
    normalizedKey = normalizeStorageKey(audioKey);
  } catch {
    throw new SessionAudioError('مسیر فایل صوتی معتبر نیست.');
  }

  const rootDirectory = normalizedKey.split('/')[0];

  if (rootDirectory !== 'audio') {
    throw new SessionAudioError(
      'فایل صوتی جلسه باید در مسیر audio ذخیره شده باشد.'
    );
  }

  return normalizedKey;
};

const normalizeSessionId = (value) => {
  const sessionId = typeof value === 'string' ? value.trim() : '';

  if (!sessionId) {
    throw new SessionAudioError('شناسه جلسه ارسال نشده است.');
  }

  return sessionId;
};

const normalizeAccessLevel = (value) => {
  const accessLevel =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (!VALID_ACCESS_LEVELS.has(accessLevel)) {
    throw new SessionAudioError('سطح دسترسی فایل صوتی معتبر نیست.');
  }

  return accessLevel;
};

const publishSessionAudio = async ({
  audioKey,
  accessLevel,
  sessionId,
  log,
}) => {
  const result = await prismadb.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: {
        id: sessionId,
      },

      select: {
        id: true,
        audioId: true,

        audio: {
          select: {
            id: true,
            audioKey: true,
          },
        },
      },
    });

    if (!session) {
      throw new SessionAudioError('جلسه موردنظر پیدا نشد.', 404);
    }

    const previousAudioKey = session.audio?.audioKey || null;

    let sessionAudio;
    let mutationType;

    if (session.audioId) {
      sessionAudio = await tx.sessionAudio.update({
        where: {
          id: session.audioId,
        },

        data: {
          audioKey,
          accessLevel,
          status: 'AVAILABLE',
        },
      });

      mutationType = 'UPDATED';
    } else {
      sessionAudio = await tx.sessionAudio.create({
        data: {
          audioKey,
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
        audioId: sessionAudio.id,

        type: 'AUDIO',
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
      audio: sessionAudio,
      session: updatedSession,

      mutationType,

      previousAudioKey,
    };
  });

  const previousAudioKey = result.previousAudioKey;

  const previousAudioReplaced = Boolean(
    previousAudioKey && previousAudioKey !== audioKey
  );

  let previousAudioDeleted = false;

  /*
   * حذف فایل قبلی خارج از تراکنش دیتابیس انجام می‌شود.
   * شکست Cleanup نباید اتصال موفق فایل جدید را Rollback کند.
   */
  if (previousAudioReplaced && !isAbsoluteHttpUrl(previousAudioKey)) {
    const storage = getMediaStorage();

    try {
      await storage.deletePath(previousAudioKey);

      previousAudioDeleted = true;

      log.info(
        {
          event: 'session_previous_audio_deleted',

          previousStorageKey: previousAudioKey,
        },
        'Previous session audio file deleted'
      );
    } catch (error) {
      logError({
        log,
        error,

        message: 'Failed to delete previous session audio file',

        data: {
          event: 'session_previous_audio_delete_failed',

          previousStorageKey: previousAudioKey,
        },
      });
    }
  }

  return {
    ...result,

    previousAudioReplaced,
    previousAudioDeleted,
  };
};

const handleMutation = async (request, httpMethod) => {
  let log = getRequestLogger({
    component: 'session-audio-mutation',

    mutationMethod: httpMethod,
  });

  let sessionId = null;
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

    const audioKey = normalizeAudioKey(body?.audioKey);

    sessionId = normalizeSessionId(body?.sessionId);

    accessLevel = normalizeAccessLevel(body?.accessLevel);

    storageKind = isAbsoluteHttpUrl(audioKey) ? 'LEGACY_EXTERNAL' : 'LOCAL';

    localStorageKey = storageKind === 'LOCAL' ? audioKey : null;

    log = log.child({
      sessionId,
      mediaType: 'AUDIO',
      accessLevel,
      storageKind,
    });

    log.info(
      {
        event: 'session_audio_publish_started',

        storageKey: localStorageKey,
      },
      'Session audio publish started'
    );

    const result = await publishSessionAudio({
      audioKey,
      sessionId,
      accessLevel,
      log,
    });

    log.info(
      {
        event: 'session_audio_published',

        audioId: result.audio.id,

        mutationType: result.mutationType,

        previousAudioReplaced: result.previousAudioReplaced,

        previousAudioDeleted: result.previousAudioDeleted,

        sessionActive: result.session.isActive,
      },
      'Session audio published successfully'
    );

    return NextResponse.json(
      {
        success: true,

        data: result.audio,

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
          event: 'session_audio_publish_rejected',

          status: 400,
          reason: 'INVALID_JSON',
        },
        'Session audio request body was invalid'
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

    if (error instanceof SessionAudioError) {
      log.warn(
        {
          event: 'session_audio_publish_rejected',

          status: error.status,
          reason: error.message,

          sessionId,
          accessLevel,
          storageKind,
        },
        'Session audio publish was rejected'
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

      message: 'Session audio publish failed',

      data: {
        event: 'session_audio_publish_failed',

        sessionId,
        accessLevel,
        storageKind,

        storageKey: localStorageKey,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در ذخیره اطلاعات فایل صوتی.',
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
  route: '/api/session-audio',

  component: 'session-audio-api',
});

export const PUT = withApiLogging(handlePut, {
  route: '/api/session-audio',

  component: 'session-audio-api',
});
