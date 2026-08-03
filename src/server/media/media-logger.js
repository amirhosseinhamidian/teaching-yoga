import { createChildLogger } from '@/server/logger';

export const mediaLogger = createChildLogger({
  component: 'media',
});

export const getSessionMediaLogger = ({
  sessionId = null,
  mediaType = null,
  assetPath = null,
} = {}) => {
  return mediaLogger.child({
    sessionId,
    mediaType,
    assetPath,
  });
};

export const isManifestAsset = (assetPath) => {
  return String(assetPath || '')
    .toLowerCase()
    .endsWith('.m3u8');
};

export const isSegmentAsset = (assetPath) => {
  return /\.(ts|m4s)$/i.test(String(assetPath || ''));
};

export const isMissingMediaError = (error) => {
  return error?.code === 'ENOENT' || error?.code === 'EISDIR';
};

export const isExpectedMediaAccessError = (error) => {
  const code = String(error?.code || '');

  const message = String(error?.message || '');

  if (
    code.startsWith('ERR_JWT') ||
    code.startsWith('ERR_JWS') ||
    code.startsWith('ERR_JOSE')
  ) {
    return true;
  }

  return new Set([
    'MEDIA_TOKEN_REQUIRED',
    'INVALID_MEDIA_TOKEN',
    'MEDIA_TOKEN_USER_MISMATCH',
  ]).has(message);
};
