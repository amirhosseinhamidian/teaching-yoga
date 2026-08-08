/* eslint-disable no-undef */

import {
  getAppPublicBaseUrl,
  getMediaPublicBaseUrl,
  toAbsoluteMediaUrl,
} from './absolute-url';

const HTTP_URL_PATTERN = /^https?:\/\//i;

const MEDIA_PATH_PATTERN = /^\/?(images|audio|videos|podcast)(\/|$)/i;

const getHostname = (value) => {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const getConfiguredInternalHosts = () => {
  return new Set(
    [getAppPublicBaseUrl(), getMediaPublicBaseUrl()]
      .map(getHostname)
      .filter(Boolean)
  );
};

const isSamaneYogaHost = (hostname) => {
  if (!hostname) return false;

  return hostname === 'samaneyoga.ir' || hostname.endsWith('.samaneyoga.ir');
};

const isConfiguredLegacyHost = (hostname) => {
  if (!hostname) return false;

  const legacyOrigins = String(process.env.LEGACY_MEDIA_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return legacyOrigins.some((origin) => {
    try {
      return new URL(origin).hostname.toLowerCase() === hostname;
    } catch {
      return false;
    }
  });
};

const isInternalMediaHost = (hostname) => {
  if (!hostname) return false;

  if (getConfiguredInternalHosts().has(hostname)) {
    return true;
  }

  if (isSamaneYogaHost(hostname)) {
    return true;
  }

  return isConfiguredLegacyHost(hostname);
};

/**
 * Media URL resolver
 *
 * Examples:
 *
 * images/avatars/user.jpg
 * => https://media.samaneyoga.ir/images/avatars/user.jpg
 *
 * https://beta.samaneyoga.ir/images/avatars/user.jpg
 * => https://media.samaneyoga.ir/images/avatars/user.jpg
 *
 * https://vps.samaneyoga.ir/images/...
 * => https://media.samaneyoga.ir/images/...
 *
 * https://lh3.googleusercontent.com/...
 * => unchanged
 */
export const normalizeMediaUrl = (value) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  /*
   * Storage key / relative media path
   */
  if (!HTTP_URL_PATTERN.test(rawValue)) {
    try {
      return toAbsoluteMediaUrl(rawValue);
    } catch {
      return rawValue;
    }
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(rawValue);
  } catch {
    return rawValue;
  }

  /*
   * External URLs such as Google avatars must remain untouched.
   */
  if (!isInternalMediaHost(parsedUrl.hostname.toLowerCase())) {
    try {
      return toAbsoluteMediaUrl(rawValue);
    } catch {
      return rawValue;
    }
  }

  let pathname;

  try {
    pathname = decodeURIComponent(parsedUrl.pathname || '');
  } catch {
    pathname = parsedUrl.pathname || '';
  }

  pathname = pathname.replace(/\\/g, '/').replace(/\/{2,}/g, '/');

  /*
   * An internal URL which is not actually a managed media path
   * should not be rewritten.
   */
  if (!MEDIA_PATH_PATTERN.test(pathname)) {
    return rawValue;
  }

  const mediaPath =
    `${pathname}${parsedUrl.search || ''}${parsedUrl.hash || ''}`.replace(
      /^\/+/,
      ''
    );

  try {
    return toAbsoluteMediaUrl(mediaPath);
  } catch {
    return rawValue;
  }
};
