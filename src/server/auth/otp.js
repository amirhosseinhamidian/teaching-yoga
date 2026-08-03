/* eslint-disable no-undef */
import 'server-only';

import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import prismadb from '@/libs/prismadb';

const DEFAULT_OTP_TTL_SECONDS = 120;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_MAX_SENDS_PER_HOUR = 5;
const OTP_WINDOW_SECONDS = 60 * 60;

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  firstname: true,
  lastname: true,
  phone: true,
  email: true,
  avatar: true,
  role: true,
};

export class OtpAuthError extends Error {
  constructor(
    message,
    { status = 400, code = 'OTP_ERROR', retryAfterSeconds = null } = {}
  ) {
    super(message);

    this.name = 'OtpAuthError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

export const getOtpConfig = () => ({
  ttlSeconds: getPositiveInteger(
    process.env.OTP_TTL_SECONDS,
    DEFAULT_OTP_TTL_SECONDS
  ),

  resendCooldownSeconds: getPositiveInteger(
    process.env.OTP_RESEND_COOLDOWN_SECONDS,
    DEFAULT_RESEND_COOLDOWN_SECONDS
  ),

  maxAttempts: getPositiveInteger(
    process.env.OTP_MAX_ATTEMPTS,
    DEFAULT_MAX_ATTEMPTS
  ),

  maxSendsPerHour: getPositiveInteger(
    process.env.OTP_MAX_SENDS_PER_HOUR,
    DEFAULT_MAX_SENDS_PER_HOUR
  ),
});

const getOtpSecret = () => {
  const secret = String(
    process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || ''
  ).trim();

  if (secret.length < 32) {
    throw new Error('OTP_HASH_SECRET must contain at least 32 characters.');
  }

  return secret;
};

const normalizeDigits = (value) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
};

export const normalizeIranianPhone = (value) => {
  let phone = normalizeDigits(value)
    .normalize('NFKC')
    .trim()
    .replace(/[^\d+]/g, '');

  if (phone.startsWith('+98')) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith('0098')) {
    phone = `0${phone.slice(4)}`;
  } else if (/^98\d{10}$/.test(phone)) {
    phone = `0${phone.slice(2)}`;
  } else if (/^9\d{9}$/.test(phone)) {
    phone = `0${phone}`;
  }

  if (!/^09\d{9}$/.test(phone)) {
    throw new OtpAuthError('شماره موبایل معتبر نیست.', {
      status: 400,
      code: 'INVALID_PHONE',
    });
  }

  return phone;
};

export const normalizeOtpCode = (value) => {
  const code = normalizeDigits(value).trim();

  if (!/^\d{5}$/.test(code)) {
    throw new OtpAuthError('کد تأیید باید ۵ رقمی باشد.', {
      status: 400,
      code: 'INVALID_OTP_FORMAT',
    });
  }

  return code;
};

export const normalizeOtpChallengeId = (value) => {
  const challengeId = typeof value === 'string' ? value.trim() : '';

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      challengeId
    )
  ) {
    throw new OtpAuthError('درخواست تأیید معتبر نیست.', {
      status: 400,
      code: 'INVALID_CHALLENGE',
    });
  }

  return challengeId;
};

export const normalizeOtpUsername = (value) => {
  const username =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  if (!username) {
    return null;
  }

  if (username.length < 3 || username.length > 60) {
    throw new OtpAuthError('نام کاربری باید بین ۳ تا ۶۰ کاراکتر باشد.', {
      status: 400,
      code: 'INVALID_USERNAME',
    });
  }

  return username;
};

const hashOtpCode = ({ phone, code }) => {
  return createHmac('sha256', getOtpSecret())
    .update(`otp:${phone}:${code}`)
    .digest('hex');
};

const isOtpHashEqual = ({ phone, code, expectedHash }) => {
  const actualHash = hashOtpCode({
    phone,
    code,
  });

  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
};

export const getAuthSubjectId = (phone) => {
  return createHmac('sha256', getOtpSecret())
    .update(`subject:${phone}`)
    .digest('hex')
    .slice(0, 20);
};

export const createOtpChallenge = async (rawPhone) => {
  const phone = normalizeIranianPhone(rawPhone);

  const config = getOtpConfig();

  const now = new Date();

  const existingChallenge = await prismadb.otpChallenge.findUnique({
    where: {
      phone,
    },
  });

  if (existingChallenge) {
    const cooldownEndsAt =
      existingChallenge.lastSentAt.getTime() +
      config.resendCooldownSeconds * 1000;

    if (cooldownEndsAt > now.getTime()) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((cooldownEndsAt - now.getTime()) / 1000)
      );

      throw new OtpAuthError(
        `لطفاً ${retryAfterSeconds} ثانیه دیگر دوباره تلاش کنید.`,
        {
          status: 429,
          code: 'OTP_RESEND_COOLDOWN',
          retryAfterSeconds,
        }
      );
    }
  }

  let sendCount = 1;
  let windowStartedAt = now;

  if (existingChallenge) {
    const windowAge =
      now.getTime() - existingChallenge.windowStartedAt.getTime();

    if (windowAge < OTP_WINDOW_SECONDS * 1000) {
      if (existingChallenge.sendCount >= config.maxSendsPerHour) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((OTP_WINDOW_SECONDS * 1000 - windowAge) / 1000)
        );

        throw new OtpAuthError(
          'تعداد درخواست‌های ارسال کد بیش از حد مجاز است.',
          {
            status: 429,
            code: 'OTP_SEND_LIMIT',
            retryAfterSeconds,
          }
        );
      }

      sendCount = existingChallenge.sendCount + 1;
      windowStartedAt = existingChallenge.windowStartedAt;
    }
  }

  const code = String(randomInt(10000, 100000));

  const challengeId = randomUUID();

  const expiresAt = new Date(now.getTime() + config.ttlSeconds * 1000);

  const codeHash = hashOtpCode({
    phone,
    code,
  });

  const challenge = await prismadb.otpChallenge.upsert({
    where: {
      phone,
    },

    update: {
      challengeId,
      codeHash,
      expiresAt,

      attempts: 0,
      consumedAt: null,

      sendCount,
      windowStartedAt,
      lastSentAt: now,
    },

    create: {
      challengeId,
      phone,
      codeHash,
      expiresAt,

      attempts: 0,
      consumedAt: null,

      sendCount,
      windowStartedAt,
      lastSentAt: now,
    },

    select: {
      id: true,
      challengeId: true,
      expiresAt: true,
    },
  });

  return {
    phone,
    code,

    challengeId: challenge.challengeId,

    expiresAt: challenge.expiresAt,

    expiresInSeconds: config.ttlSeconds,

    resendAfterSeconds: config.resendCooldownSeconds,
  };
};

export const invalidateOtpChallenge = async (challengeId) => {
  await prismadb.otpChallenge.updateMany({
    where: {
      challengeId,
      consumedAt: null,
    },

    data: {
      consumedAt: new Date(),
      expiresAt: new Date(0),
    },
  });
};

export const completeOtpAuthentication = async ({
  phone: rawPhone,
  code: rawCode,
  challengeId: rawChallengeId,
  username: rawUsername,
}) => {
  const phone = normalizeIranianPhone(rawPhone);
  const code = normalizeOtpCode(rawCode);

  const challengeId = normalizeOtpChallengeId(rawChallengeId);

  const username = normalizeOtpUsername(rawUsername);

  const config = getOtpConfig();

  const challenge = await prismadb.otpChallenge.findUnique({
    where: {
      challengeId,
    },
  });

  const genericInvalidError = () =>
    new OtpAuthError('کد تأیید نامعتبر یا منقضی شده است.', {
      status: 400,
      code: 'OTP_INVALID',
    });

  if (
    !challenge ||
    challenge.phone !== phone ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= config.maxAttempts
  ) {
    throw genericInvalidError();
  }

  const codeMatches = isOtpHashEqual({
    phone,
    code,
    expectedHash: challenge.codeHash,
  });

  if (!codeMatches) {
    await prismadb.otpChallenge.updateMany({
      where: {
        id: challenge.id,
        consumedAt: null,

        attempts: {
          lt: config.maxAttempts,
        },
      },

      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    throw genericInvalidError();
  }

  const currentUser = await prismadb.user.findUnique({
    where: {
      phone,
    },

    select: SAFE_USER_SELECT,
  });

  if (!currentUser && !username) {
    throw new OtpAuthError('حساب کاربری برای این شماره پیدا نشد.', {
      status: 404,
      code: 'USER_NOT_FOUND',
    });
  }

  if (!currentUser && username) {
    const usernameExists = await prismadb.user.findUnique({
      where: {
        username,
      },

      select: {
        id: true,
      },
    });

    if (usernameExists) {
      throw new OtpAuthError('این نام کاربری قبلاً استفاده شده است.', {
        status: 409,
        code: 'USERNAME_EXISTS',
      });
    }
  }

  try {
    const result = await prismadb.$transaction(async (tx) => {
      const consumeResult = await tx.otpChallenge.updateMany({
        where: {
          id: challenge.id,
          challengeId,
          phone,
          codeHash: challenge.codeHash,

          consumedAt: null,

          expiresAt: {
            gt: new Date(),
          },

          attempts: {
            lt: config.maxAttempts,
          },
        },

        data: {
          consumedAt: new Date(),
        },
      });

      if (consumeResult.count !== 1) {
        return {
          kind: 'INVALID',
        };
      }

      let user = await tx.user.findUnique({
        where: {
          phone,
        },

        select: SAFE_USER_SELECT,
      });

      let created = false;

      if (!user) {
        user = await tx.user.create({
          data: {
            username,
            phone,
            role: 'USER',
          },

          select: SAFE_USER_SELECT,
        });

        created = true;
      }

      return {
        kind: 'SUCCESS',
        user,
        created,
      };
    });

    if (result.kind !== 'SUCCESS') {
      throw genericInvalidError();
    }

    return {
      phone,
      user: result.user,
      created: result.created,
    };
  } catch (error) {
    if (error instanceof OtpAuthError) {
      throw error;
    }

    if (error?.code === 'P2002') {
      throw new OtpAuthError('شماره موبایل یا نام کاربری قبلاً ثبت شده است.', {
        status: 409,
        code: 'USER_CONFLICT',
      });
    }

    throw error;
  }
};
