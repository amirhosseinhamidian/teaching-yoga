import 'server-only';

import { randomUUID } from 'node:crypto';

import { SignJWT, jwtVerify } from 'jose';

import { normalizeStorageKey } from '@/server/storage';
import { getAuthUser } from '@/utils/getAuthUser';

const TOKEN_ISSUER = 'teaching-yoga';

const TOKEN_AUDIENCE = 'session-media';

const DEFAULT_TOKEN_TTL_SECONDS = 6 * 60 * 60;

const MIN_TOKEN_TTL_SECONDS = 5 * 60;

const MAX_TOKEN_TTL_SECONDS = 24 * 60 * 60;

const getTokenSecret = () => {
  const value =
    process.env.SESSION_MEDIA_TOKEN_SECRET || process.env.JWT_SECRET;

  if (typeof value !== 'string' || value.length < 32) {
    throw new Error(
      'SESSION_MEDIA_TOKEN_SECRET must contain at least 32 characters.'
    );
  }

  return new TextEncoder().encode(value);
};

const getTokenTtlSeconds = () => {
  const configured = Number(process.env.SESSION_MEDIA_TOKEN_TTL_SECONDS);

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_TOKEN_TTL_SECONDS;
  }

  return Math.min(
    MAX_TOKEN_TTL_SECONDS,
    Math.max(MIN_TOKEN_TTL_SECONDS, Math.floor(configured))
  );
};

const normalizeMediaType = (value) => {
  const mediaType = String(value || '')
    .trim()
    .toUpperCase();

  if (mediaType !== 'VIDEO' && mediaType !== 'AUDIO') {
    throw new Error('Invalid session media type.');
  }

  return mediaType;
};

const normalizeMediaStorageKey = ({ storageKey, mediaType }) => {
  const normalizedKey = normalizeStorageKey(
    String(storageKey || '')
      .replace(/^\/+/, '')
      .replace(/^local-videos\/+/, '')
  );

  const root = normalizedKey.split('/')[0];

  const expectedRoot = mediaType === 'VIDEO' ? 'videos' : 'audio';

  if (root !== expectedRoot) {
    throw new Error('Invalid session media storage root.');
  }

  return normalizedKey;
};

export async function createSessionMediaToken({
  sessionId,
  mediaType,
  mediaId,
  storageKey,
  userId,
  accessLevel,
}) {
  const normalizedSessionId = String(sessionId || '').trim();

  if (!normalizedSessionId) {
    throw new Error('Session ID is required.');
  }

  const normalizedMediaType = normalizeMediaType(mediaType);

  const normalizedStorageKey = normalizeMediaStorageKey({
    storageKey,
    mediaType: normalizedMediaType,
  });

  const subject = userId ? String(userId) : 'public';

  const ttlSeconds = getTokenTtlSeconds();

  return new SignJWT({
    purpose: 'session-media',

    sessionId: normalizedSessionId,

    mediaType: normalizedMediaType,

    mediaId: String(mediaId),

    storageKey: normalizedStorageKey,

    accessLevel: String(accessLevel || 'REGISTERED').toUpperCase(),
  })
    .setProtectedHeader({
      alg: 'HS256',
      typ: 'JWT',
    })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setSubject(subject)
    .setJti(randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getTokenSecret());
}

export async function verifySessionMediaToken({ token, sessionId, mediaType }) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('MEDIA_TOKEN_REQUIRED');
  }

  const expectedMediaType = normalizeMediaType(mediaType);

  const { payload } = await jwtVerify(token.trim(), getTokenSecret(), {
    issuer: TOKEN_ISSUER,

    audience: TOKEN_AUDIENCE,

    algorithms: ['HS256'],
  });

  if (payload.purpose !== 'session-media') {
    throw new Error('INVALID_MEDIA_TOKEN');
  }

  if (payload.sessionId !== String(sessionId)) {
    throw new Error('INVALID_MEDIA_TOKEN');
  }

  if (payload.mediaType !== expectedMediaType) {
    throw new Error('INVALID_MEDIA_TOKEN');
  }

  const tokenSubject =
    typeof payload.sub === 'string' ? payload.sub.trim() : '';

  if (!tokenSubject) {
    throw new Error('INVALID_MEDIA_TOKEN');
  }

  /*
   * محتوای PUBLIC بدون کوکی قابل استفاده است.
   * Tokenهای REGISTERED، PURCHASED و ADMIN فقط همراه
   * با کوکی همان کاربری کار می‌کنند که Token برایش صادر شده.
   */
  if (tokenSubject !== 'public') {
    const authenticatedUser = await getAuthUser();

    if (
      !authenticatedUser?.id ||
      String(authenticatedUser.id) !== tokenSubject
    ) {
      throw new Error('MEDIA_TOKEN_USER_MISMATCH');
    }
  }

  const storageKey = normalizeMediaStorageKey({
    storageKey: payload.storageKey,

    mediaType: expectedMediaType,
  });

  return {
    payload,
    storageKey,
  };
}

const encodePath = (value) =>
  String(value)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const createProtectedSessionMediaUrl = ({
  sessionId,
  mediaType,
  token,
  assetPath,
}) => {
  const encodedSessionId = encodeURIComponent(String(sessionId));

  const normalizedMediaType = normalizeMediaType(mediaType);

  const tokenQuery = `token=${encodeURIComponent(token)}`;

  if (normalizedMediaType === 'AUDIO') {
    return (
      `/api/protected-media/session/` +
      `${encodedSessionId}/audio?` +
      tokenQuery
    );
  }

  const encodedAssetPath = encodePath(assetPath || 'master.m3u8');

  return (
    `/api/protected-media/session/` +
    `${encodedSessionId}/video/` +
    `${encodedAssetPath}?` +
    tokenQuery
  );
};
