import 'server-only';

import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { normalizeStorageKey } from '@/server/storage';
import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGER']);

const HTTP_URL_PATTERN = /^https?:\/\//i;

const createDeniedResult = ({ status, code, message }) => ({
  ok: false,
  status,
  code,
  message,
});

const STORAGE_ROOT_ALIASES = {
  audio: new Set(['audio', 'audios']),

  videos: new Set(['videos', 'video']),
};

const decodePathSafely = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getMediaPathValue = (rawValue) => {
  if (!HTTP_URL_PATTERN.test(rawValue)) {
    return rawValue.split(/[?#]/, 1)[0];
  }

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return parsedUrl.pathname;
  } catch {
    return null;
  }
};

const normalizeLocalMediaKey = (value, expectedRoot) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  const aliases = STORAGE_ROOT_ALIASES[expectedRoot];

  if (!aliases) {
    return null;
  }

  let cleanValue = getMediaPathValue(rawValue);

  if (!cleanValue) {
    return null;
  }

  cleanValue = decodePathSafely(cleanValue)
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '');

  /*
   * مسیر عمومی قدیمی ویدئو در نسخه Local:
   *
   * /local-videos/<path>
   *
   * اگر بعد از Prefix
   * root استاندارد وجود نداشته باشد،
   * آن را به videos/... تبدیل می‌کنیم.
   */
  if (expectedRoot === 'videos' && cleanValue.startsWith('local-videos/')) {
    const withoutPrefix = cleanValue.slice('local-videos/'.length);

    if (
      !withoutPrefix.startsWith('videos/') &&
      !withoutPrefix.startsWith('video/')
    ) {
      cleanValue = `videos/${withoutPrefix}`;
    } else {
      cleanValue = withoutPrefix;
    }
  }

  /*
   * سازگاری با مسیرهای
   * قدیمی Audio
   */
  if (expectedRoot === 'audio') {
    for (const prefix of ['local-audio/', 'local-audios/']) {
      if (cleanValue.startsWith(prefix)) {
        cleanValue = `audio/${cleanValue.slice(prefix.length)}`;

        break;
      }
    }
  }

  let normalizedValue;

  try {
    normalizedValue = normalizeStorageKey(cleanValue);
  } catch {
    return null;
  }

  let segments = normalizedValue.split('/').filter(Boolean);

  if (!segments.length) {
    return null;
  }

  const firstSegment = segments[0].toLowerCase();

  /*
   * حالت استاندارد:
   *
   * audio/...
   * videos/...
   *
   * و Aliasهای قدیمی:
   *
   * audios/...
   * video/...
   */
  if (aliases.has(firstSegment)) {
    segments[0] = expectedRoot;
  } else {
    /*
     * URLهای قدیمی S3/Liara
     * ممکن است Prefix داشته باشند:
     *
     * https://.../bucket/audio/.../file.mp3
     *
     * از root رسانه به بعد
     * استخراج می‌کنیم.
     */
    const rootIndex = segments.findIndex((segment) =>
      aliases.has(segment.toLowerCase())
    );

    if (rootIndex >= 0) {
      segments = segments.slice(rootIndex);

      segments[0] = expectedRoot;
    } else if (segments.length === 1) {
      /*
       * سازگاری محدود با
       * داده‌های خیلی قدیمی
       * که فقط نام فایل بوده.
       */
      segments = [expectedRoot, segments[0]];
    } else {
      return null;
    }
  }

  try {
    normalizedValue = normalizeStorageKey(segments.join('/'));
  } catch {
    return null;
  }

  const root = normalizedValue.split('/')[0];

  if (root !== expectedRoot) {
    return null;
  }

  return normalizedValue;
};

const getAuthenticatedDatabaseUser = async () => {
  let tokenUser = null;

  try {
    tokenUser = await getAuthUser();
  } catch (error) {
    logError({
      log: getRequestLogger({
        component: 'session-media-access',
      }),

      error,

      message: 'Session media authentication token could not be read',

      data: {
        event: 'session_media_authentication_failed',
      },
    });

    return null;
  }

  if (!tokenUser?.id) {
    return null;
  }

  return prismadb.user.findUnique({
    where: {
      id: tokenUser.id,
    },

    select: {
      id: true,
      role: true,
      username: true,
      phone: true,
      email: true,
    },
  });
};

const collectSessionTermData = (session) => {
  const termsById = new Map();

  for (const sessionTerm of session.sessionTerms || []) {
    const term = sessionTerm.term;

    if (!term?.id) {
      continue;
    }

    termsById.set(term.id, term);
  }

  /*
   * سازگاری با داده‌های قدیمی
   * Session.termId
   */
  if (session.term?.id) {
    termsById.set(session.term.id, session.term);
  }

  const terms = [...termsById.values()];

  const termIds = terms.map((term) => term.id);

  const courseIds = [
    ...new Set(
      terms.flatMap((term) =>
        (term.courseTerms || []).map((courseTerm) => courseTerm.courseId)
      )
    ),
  ];

  return {
    terms,
    termIds,
    courseIds,
  };
};

const selectSessionMedia = (session) => {
  if (session.type === 'AUDIO' && session.audio?.audioKey) {
    return {
      mediaType: 'AUDIO',

      media: session.audio,

      rawStorageKey: session.audio.audioKey,

      expectedRoot: 'audio',
    };
  }

  if (session.type === 'VIDEO' && session.video?.videoKey) {
    return {
      mediaType: 'VIDEO',

      media: session.video,

      rawStorageKey: session.video.videoKey,

      expectedRoot: 'videos',
    };
  }

  /*
   * Fallback برای داده‌های قدیمی
   * که Session.type با رسانه
   * ثبت‌شده هماهنگ نیست.
   */
  if (session.video?.videoKey) {
    return {
      mediaType: 'VIDEO',

      media: session.video,

      rawStorageKey: session.video.videoKey,

      expectedRoot: 'videos',
    };
  }

  if (session.audio?.audioKey) {
    return {
      mediaType: 'AUDIO',

      media: session.audio,

      rawStorageKey: session.audio.audioKey,

      expectedRoot: 'audio',
    };
  }

  return null;
};

const checkPurchasedAccess = async ({ userId, termIds, courseIds }) => {
  const now = new Date();

  const [userTerm, userCourse, subscription] = await Promise.all([
    termIds.length > 0
      ? prismadb.userTerm.findFirst({
          where: {
            userId,

            termId: {
              in: termIds,
            },
          },

          select: {
            id: true,
            termId: true,
          },
        })
      : null,

    courseIds.length > 0
      ? prismadb.userCourse.findFirst({
          where: {
            userId,

            courseId: {
              in: courseIds,
            },

            status: 'ACTIVE',
          },

          select: {
            id: true,
            courseId: true,
          },
        })
      : null,

    courseIds.length > 0
      ? prismadb.userSubscription.findFirst({
          where: {
            userId,

            status: 'ACTIVE',

            startDate: {
              lte: now,
            },

            endDate: {
              gte: now,
            },

            plan: {
              planCourses: {
                some: {
                  courseId: {
                    in: courseIds,
                  },
                },
              },
            },
          },

          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        })
      : null,
  ]);

  if (userTerm) {
    return {
      allowed: true,
      reason: 'TERM_PURCHASE',
    };
  }

  if (userCourse) {
    return {
      allowed: true,
      reason: 'COURSE_PURCHASE',
    };
  }

  if (subscription) {
    return {
      allowed: true,
      reason: 'SUBSCRIPTION',
    };
  }

  return {
    allowed: false,
    reason: null,
  };
};

export async function authorizeSessionMedia(sessionId) {
  const normalizedSessionId =
    typeof sessionId === 'string' ? sessionId.trim() : '';

  if (!normalizedSessionId) {
    return createDeniedResult({
      status: 400,

      code: 'INVALID_SESSION_ID',

      message: 'شناسه جلسه معتبر نیست.',
    });
  }

  const session = await prismadb.session.findUnique({
    where: {
      id: normalizedSessionId,
    },

    select: {
      id: true,
      name: true,
      duration: true,
      type: true,
      isFree: true,
      isActive: true,
      termId: true,

      video: {
        select: {
          id: true,
          videoKey: true,
          accessLevel: true,
          status: true,
        },
      },

      audio: {
        select: {
          id: true,
          audioKey: true,
          accessLevel: true,
          status: true,
        },
      },

      sessionTerms: {
        select: {
          termId: true,

          term: {
            select: {
              id: true,
              name: true,

              courseTerms: {
                select: {
                  courseId: true,
                },
              },
            },
          },
        },
      },

      term: {
        select: {
          id: true,
          name: true,

          courseTerms: {
            select: {
              courseId: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return createDeniedResult({
      status: 404,

      code: 'SESSION_NOT_FOUND',

      message: 'جلسه پیدا نشد.',
    });
  }

  const selectedMedia = selectSessionMedia(session);

  if (!selectedMedia) {
    return createDeniedResult({
      status: 404,

      code: 'MEDIA_NOT_FOUND',

      message: 'رسانه‌ای برای این جلسه ثبت نشده است.',
    });
  }

  if (
    selectedMedia.media.status &&
    selectedMedia.media.status !== 'AVAILABLE'
  ) {
    return createDeniedResult({
      status: 404,

      code: 'MEDIA_UNAVAILABLE',

      message: 'رسانه این جلسه در دسترس نیست.',
    });
  }

  const storageKey = normalizeLocalMediaKey(
    selectedMedia.rawStorageKey,
    selectedMedia.expectedRoot
  );

  if (!storageKey) {
    return createDeniedResult({
      status: 409,

      code: 'MEDIA_NOT_LOCAL',

      message: 'رسانه این جلسه هنوز به Storage جدید منتقل نشده است.',
    });
  }

  const accessLevel = String(
    selectedMedia.media.accessLevel || 'REGISTERED'
  ).toUpperCase();

  const { terms, termIds, courseIds } = collectSessionTermData(session);

  /*
   * برای رسانه عمومی فعال
   * نیازی به خواندن کاربر نیست.
   *
   * جلسه غیرفعال فقط برای
   * مدیر قابل Preview است.
   */
  const shouldReadUser = !session.isActive || accessLevel !== 'PUBLIC';

  const user = shouldReadUser ? await getAuthenticatedDatabaseUser() : null;

  const role = String(user?.role || '')
    .trim()
    .toUpperCase();

  const isAdministrator = Boolean(user?.id) && ADMIN_ROLES.has(role);

  if (!session.isActive && !isAdministrator) {
    return createDeniedResult({
      status: 404,

      code: 'SESSION_NOT_AVAILABLE',

      message: 'این جلسه در دسترس نیست.',
    });
  }

  if (accessLevel === 'PUBLIC') {
    return {
      ok: true,
      status: 200,

      user: user
        ? {
            ...user,
            role,
          }
        : null,

      accessReason: isAdministrator ? 'ADMIN' : 'PUBLIC',

      session,
      terms,
      termIds,
      courseIds,

      mediaType: selectedMedia.mediaType,

      mediaId: selectedMedia.media.id,

      storageKey,

      accessLevel,
    };
  }

  if (!user) {
    return createDeniedResult({
      status: 401,

      code: 'AUTHENTICATION_REQUIRED',

      message: 'برای مشاهده این جلسه باید وارد حساب کاربری شوید.',
    });
  }

  if (ADMIN_ROLES.has(role)) {
    return {
      ok: true,
      status: 200,

      user: {
        ...user,
        role,
      },

      accessReason: 'ADMIN',

      session,
      terms,
      termIds,
      courseIds,

      mediaType: selectedMedia.mediaType,

      mediaId: selectedMedia.media.id,

      storageKey,

      accessLevel,
    };
  }

  if (accessLevel === 'REGISTERED') {
    return {
      ok: true,
      status: 200,

      user: {
        ...user,
        role,
      },

      accessReason: 'REGISTERED',

      session,
      terms,
      termIds,
      courseIds,

      mediaType: selectedMedia.mediaType,

      mediaId: selectedMedia.media.id,

      storageKey,

      accessLevel,
    };
  }

  if (accessLevel !== 'PURCHASED') {
    return createDeniedResult({
      status: 403,

      code: 'INVALID_ACCESS_LEVEL',

      message: 'سطح دسترسی رسانه معتبر نیست.',
    });
  }

  const purchasedAccess = await checkPurchasedAccess({
    userId: user.id,
    termIds,
    courseIds,
  });

  if (!purchasedAccess.allowed) {
    return createDeniedResult({
      status: 403,

      code: 'PURCHASE_REQUIRED',

      message: 'برای مشاهده این جلسه باید دوره یا ترم مربوطه را تهیه کنید.',
    });
  }

  return {
    ok: true,
    status: 200,

    user: {
      ...user,
      role,
    },

    accessReason: purchasedAccess.reason,

    session,
    terms,
    termIds,
    courseIds,

    mediaType: selectedMedia.mediaType,

    mediaId: selectedMedia.media.id,

    storageKey,

    accessLevel,
  };
}
