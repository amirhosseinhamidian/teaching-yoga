import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

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

const isAbsoluteHttpUrl = (value) => /^https?:\/\//i.test(value);

const normalizeAudioKey = (value) => {
  const audioKey = typeof value === 'string' ? value.trim() : '';

  if (!audioKey) {
    throw new SessionAudioError('مسیر فایل صوتی ارسال نشده است.');
  }

  /*
   * برای سازگاری با فایل‌های قدیمی S3،
   * URLهای کامل را فعلاً قبول می‌کنیم.
   */
  if (isAbsoluteHttpUrl(audioKey)) {
    return audioKey;
  }

  try {
    return normalizeStorageKey(audioKey);
  } catch {
    throw new SessionAudioError('مسیر فایل صوتی معتبر نیست.');
  }
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

const publishSessionAudio = async ({ audioKey, accessLevel, sessionId }) => {
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
    } else {
      sessionAudio = await tx.sessionAudio.create({
        data: {
          audioKey,
          accessLevel,
          status: 'AVAILABLE',
        },
      });
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
      previousAudioKey,
    };
  });

  const previousAudioKey = result.previousAudioKey;

  if (
    previousAudioKey &&
    previousAudioKey !== audioKey &&
    !isAbsoluteHttpUrl(previousAudioKey)
  ) {
    const storage = getMediaStorage();

    await storage.deletePath(previousAudioKey).catch((error) => {
      console.error('[session-audio] Failed to delete previous audio:', error);
    });
  }

  return result;
};

const handleRequest = async (request) => {
  try {
    const body = await request.json();

    const audioKey = normalizeAudioKey(body?.audioKey);

    const sessionId = normalizeSessionId(body?.sessionId);

    const accessLevel = normalizeAccessLevel(body?.accessLevel);

    const result = await publishSessionAudio({
      audioKey,
      sessionId,
      accessLevel,
    });

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
    if (error instanceof SessionAudioError) {
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

    console.error('[session-audio] Save error:', error);

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

export async function POST(request) {
  return handleRequest(request);
}

export async function PUT(request) {
  return handleRequest(request);
}
