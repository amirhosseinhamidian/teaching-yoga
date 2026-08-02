import { normalizeStorageKey } from '@/server/storage';

const HTTP_URL_PATTERN = /^https?:\/\//i;

const ALLOWED_MEDIA_ROOTS = new Set(['images', 'audio', 'videos', 'podcast']);

export const toPublicMediaPath = (storageKey) => {
  const normalizedKey = normalizeStorageKey(storageKey);

  return `/${normalizedKey}`;
};

export const normalizePublicMediaValue = (
  value,
  { allowExternalUrl = true } = {}
) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  if (HTTP_URL_PATTERN.test(rawValue)) {
    if (!allowExternalUrl) {
      throw new Error('External URLs are not allowed.');
    }

    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid media URL protocol.');
    }

    return parsedUrl.toString();
  }

  const key = normalizeStorageKey(rawValue.replace(/^\/+/, ''));

  const rootDirectory = key.split('/')[0];

  if (!ALLOWED_MEDIA_ROOTS.has(rootDirectory)) {
    throw new Error('Invalid public media path.');
  }

  return `/${key}`;
};

export const isValidPublicMediaValue = (value, options) => {
  try {
    return Boolean(normalizePublicMediaValue(value, options));
  } catch {
    return false;
  }
};

export const publicMediaPathToKey = (value) => {
  const normalizedValue = normalizePublicMediaValue(value, {
    allowExternalUrl: false,
  });

  if (!normalizedValue) {
    return null;
  }

  return normalizedValue.replace(/^\/+/, '');
};
