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

const normalizeLocalMediaKey = (value, expectedRoot) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  /*
   * این Route فقط فایل‌های Storage محلی را تحویل می‌دهد.
   * URLهای خارجی باید پیش از Production مهاجرت شوند.
   */
  if (HTTP_URL_PATTERN.test(rawValue)) {
    return null;
  }

  let cleanValue = rawValue.replace(/^\/+/, '').replace(/^local-videos\/+/, '');

  try {
    cleanValue = normalizeStorageKey(cleanValue);
  } catch {
    return null;
  }

  const root = cleanValue.split('/')[0];

  if (root !== expectedRoot) {
    return null;
  }

  return cleanValue;
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
   * سازگاری با داده‌های قدیمی که هنوز
   * از Session.termId استفاده می‌کنند.
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
   * Fallback برای داده‌های قدیمی که ممکن است
   * مقدار Session.type با رسانه ثبت‌شده هماهنگ نباشد.
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
   * برای رسانه عمومی فعال نیازی به خواندن کاربر نیست.
   * اما جلسه غیرفعال فقط باید برای مدیر قابل Preview باشد.
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
