/* eslint-disable no-undef */

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { getMediaStorage, normalizeStorageKey } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ACCESS_LEVELS = new Set(['PUBLIC', 'REGISTERED', 'PURCHASED']);

const VALID_SESSION_TYPES = new Set(['VIDEO', 'AUDIO']);

class SessionRouteError extends Error {
  constructor(message, status = 400) {
    super(message);

    this.name = 'SessionRouteError';
    this.status = status;
  }
}

const getRouteParams = async (context) => {
  const params = await context.params;

  const termId = Number(params?.termId);

  const sessionId =
    typeof params?.sessionId === 'string' ? params.sessionId.trim() : '';

  if (!Number.isInteger(termId) || termId <= 0) {
    throw new SessionRouteError('شناسه ترم معتبر نیست.');
  }

  if (!sessionId) {
    throw new SessionRouteError('شناسه جلسه معتبر نیست.');
  }

  return {
    termId,
    sessionId,
  };
};

const getStorageKey = (value) => {
  const mediaKey = typeof value === 'string' ? value.trim() : '';

  if (!mediaKey) {
    return null;
  }

  if (/^https?:\/\//i.test(mediaKey)) {
    throw new Error('Absolute legacy media URLs are no longer supported.');
  }

  return normalizeStorageKey(mediaKey);
};

const getVideoDirectoryKey = (videoValue) => {
  const videoKey = getStorageKey(videoValue);

  if (!videoKey) {
    return null;
  }

  if (videoKey.endsWith('/master.m3u8')) {
    return videoKey.slice(0, -'/master.m3u8'.length);
  }

  const segments = videoKey.split('/');

  if (segments.length <= 1) {
    return videoKey;
  }

  segments.pop();

  return segments.join('/');
};

const cleanupVideoFiles = async (videoValue) => {
  const directoryKey = getVideoDirectoryKey(videoValue);

  if (!directoryKey) {
    return {
      deleted: false,
      driver: null,
      key: null,
      reason: 'empty-key',
    };
  }

  const storage = getMediaStorage();

  if (
    typeof storage.exists !== 'function' ||
    typeof storage.deletePath !== 'function'
  ) {
    throw new Error('The configured media storage does not support deletion.');
  }

  const exists = await storage.exists(directoryKey);

  if (!exists) {
    return {
      deleted: false,
      driver: 'media-storage',
      key: directoryKey,
      reason: 'not-found',
    };
  }

  await storage.deletePath(directoryKey);

  return {
    deleted: true,
    driver: 'media-storage',
    key: directoryKey,
    reason: null,
  };
};

const cleanupAudioFile = async (audioValue) => {
  const audioKey = getStorageKey(audioValue);

  if (!audioKey) {
    return {
      deleted: false,
      driver: null,
      key: null,
      reason: 'empty-key',
    };
  }

  const storage = getMediaStorage();

  if (
    typeof storage.exists !== 'function' ||
    typeof storage.deletePath !== 'function'
  ) {
    throw new Error('The configured media storage does not support deletion.');
  }

  const exists = await storage.exists(audioKey);

  if (!exists) {
    return {
      deleted: false,
      driver: 'media-storage',
      key: audioKey,
      reason: 'not-found',
    };
  }

  await storage.deletePath(audioKey);

  return {
    deleted: true,
    driver: 'media-storage',
    key: audioKey,
    reason: null,
  };
};

const reorderTermSessions = async (tx, termId) => {
  const remainingLinks = await tx.sessionTerm.findMany({
    where: {
      termId,
    },

    orderBy: [
      {
        order: 'asc',
      },
      {
        id: 'asc',
      },
    ],

    select: {
      id: true,
    },
  });

  for (let index = 0; index < remainingLinks.length; index += 1) {
    const sessionTerm = remainingLinks[index];

    await tx.sessionTerm.update({
      where: {
        id: sessionTerm.id,
      },

      data: {
        order: index + 1,
      },
    });
  }
};

// ===============================
// DELETE
// ===============================

export async function DELETE(_request, context) {
  try {
    const { termId, sessionId } = await getRouteParams(context);

    const deletionResult = await prismadb.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: {
          id: sessionId,
        },

        include: {
          video: true,
          audio: true,
        },
      });

      if (!session) {
        throw new SessionRouteError('جلسه یافت نشد.', 404);
      }

      const currentLink = await tx.sessionTerm.findFirst({
        where: {
          termId,
          sessionId,
        },

        select: {
          id: true,
        },
      });

      if (!currentLink) {
        throw new SessionRouteError('این جلسه به ترم موردنظر متصل نیست.', 404);
      }

      const otherLinkCount = await tx.sessionTerm.count({
        where: {
          sessionId,

          NOT: {
            termId,
          },
        },
      });

      await tx.sessionTerm.deleteMany({
        where: {
          termId,
          sessionId,
        },
      });

      await reorderTermSessions(tx, termId);

      if (otherLinkCount > 0) {
        return {
          fullyDeleted: false,
          sessionId,
          videoKey: null,
          audioKey: null,
        };
      }

      const videoKey = session.video?.videoKey || null;

      const audioKey = session.audio?.audioKey || null;

      const videoId = session.video?.id || null;

      const audioId = session.audio?.id || null;

      await tx.sessionProgress.deleteMany({
        where: {
          sessionId,
        },
      });

      await tx.session.delete({
        where: {
          id: sessionId,
        },
      });

      if (videoId) {
        await tx.sessionVideo.deleteMany({
          where: {
            id: videoId,
          },
        });
      }

      if (audioId) {
        await tx.sessionAudio.deleteMany({
          where: {
            id: audioId,
          },
        });
      }

      return {
        fullyDeleted: true,
        sessionId,
        videoKey,
        audioKey,
      };
    });

    if (!deletionResult.fullyDeleted) {
      return NextResponse.json(
        {
          success: true,
          fullyDeleted: false,

          message: 'جلسه فقط از این ترم حذف شد و در ترم‌های دیگر باقی ماند.',

          cleanup: {
            video: null,
            audio: null,
          },

          warnings: [],
        },
        {
          status: 200,
        }
      );
    }

    const cleanupWarnings = [];

    const cleanupResult = {
      video: null,
      audio: null,
    };

    if (deletionResult.videoKey) {
      try {
        cleanupResult.video = await cleanupVideoFiles(deletionResult.videoKey);

        if (cleanupResult.video.reason === 'not-found') {
          cleanupWarnings.push(
            'رکورد ویدئو حذف شد، اما پوشه فایل ویدئو در فضای ذخیره‌سازی پیدا نشد.'
          );
        }
      } catch (error) {
        console.error('[session-delete] Video cleanup failed:', error);

        cleanupWarnings.push(
          'رکورد جلسه حذف شد، اما پاک‌سازی فایل‌های ویدئو کامل نشد.'
        );
      }
    }

    if (deletionResult.audioKey) {
      try {
        cleanupResult.audio = await cleanupAudioFile(deletionResult.audioKey);

        if (cleanupResult.audio.reason === 'not-found') {
          cleanupWarnings.push(
            'رکورد صوت حذف شد، اما فایل صوتی در فضای ذخیره‌سازی پیدا نشد.'
          );
        }
      } catch (error) {
        console.error('[session-delete] Audio cleanup failed:', error);

        cleanupWarnings.push(
          'رکورد جلسه حذف شد، اما پاک‌سازی فایل صوتی کامل نشد.'
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        fullyDeleted: true,

        message:
          cleanupWarnings.length > 0
            ? 'جلسه حذف شد، اما بخشی از پاک‌سازی فایل‌های رسانه‌ای کامل نشد.'
            : 'جلسه و فایل‌های رسانه‌ای آن با موفقیت حذف شدند.',

        cleanup: cleanupResult,
        warnings: cleanupWarnings,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof SessionRouteError) {
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

    console.error('[session-delete] Delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در حذف جلسه.',
      },
      {
        status: 500,
      }
    );
  }
}

// ===============================
// PUT
// ===============================

export async function PUT(request, context) {
  try {
    const { termId, sessionId } = await getRouteParams(context);

    const body = await request.json();

    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    const duration = Number(body?.duration);

    const order = Number(body?.order);

    const accessLevel =
      typeof body?.accessLevel === 'string'
        ? body.accessLevel.trim().toUpperCase()
        : '';

    const type =
      typeof body?.type === 'string' ? body.type.trim().toUpperCase() : '';

    if (!name) {
      throw new SessionRouteError('عنوان جلسه معتبر نیست.');
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new SessionRouteError('مدت زمان باید عددی معتبر باشد.');
    }

    if (!Number.isInteger(order) || order <= 0) {
      throw new SessionRouteError('ترتیب جلسه معتبر نیست.');
    }

    if (!VALID_ACCESS_LEVELS.has(accessLevel)) {
      throw new SessionRouteError('سطح دسترسی مدیا معتبر نیست.');
    }

    if (!VALID_SESSION_TYPES.has(type)) {
      throw new SessionRouteError('نوع جلسه معتبر نیست.');
    }

    const updatedSession = await prismadb.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: {
          id: sessionId,
        },

        include: {
          video: true,
          audio: true,
        },
      });

      if (!session) {
        throw new SessionRouteError('جلسه‌ای با این شناسه یافت نشد.', 404);
      }

      const sessionTerm = await tx.sessionTerm.findFirst({
        where: {
          termId,
          sessionId,
        },

        select: {
          id: true,
        },
      });

      if (!sessionTerm) {
        throw new SessionRouteError('این جلسه به ترم موردنظر متصل نیست.', 404);
      }

      if (type === 'VIDEO' && !session.video) {
        throw new SessionRouteError('برای این جلسه فایل ویدئویی ثبت نشده است.');
      }

      if (type === 'AUDIO' && !session.audio) {
        throw new SessionRouteError('برای این جلسه فایل صوتی ثبت نشده است.');
      }

      await tx.sessionTerm.update({
        where: {
          id: sessionTerm.id,
        },

        data: {
          order,
        },
      });

      const updateData = {
        name,
        duration,
        type,
      };

      if (type === 'VIDEO' && session.video) {
        updateData.video = {
          update: {
            accessLevel,
          },
        };
      }

      if (type === 'AUDIO' && session.audio) {
        updateData.audio = {
          update: {
            accessLevel,
          },
        };
      }

      return tx.session.update({
        where: {
          id: sessionId,
        },

        data: updateData,

        include: {
          video: true,
          audio: true,
          sessionTerms: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,

        message: 'جلسه با موفقیت به‌روزرسانی شد.',

        updatedSession,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof SessionRouteError) {
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

    console.error('[session-update] Update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در به‌روزرسانی جلسه.',
      },
      {
        status: 500,
      }
    );
  }
}
