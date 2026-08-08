/* eslint-disable no-undef */

import 'server-only';

import { normalizeStorageKey } from '@/server/storage';

const ORIGIN_AUTH_HEADER = 'X-Teaching-Yoga-Origin-Key';

const DEFAULT_ORIGIN_TIMEOUT_MS = 120_000;

const getRequiredEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

const getPositiveInteger = (value, fallback, name) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsedValue;
};

/*
 * Delivery Driver از Storage Driver جداست.
 *
 * Storage Driver:
 * برای Upload / Video Worker
 *
 * Delivery Driver:
 * برای خواندن فایل‌های منتشرشده
 */
const getDeliveryDriver = () => {
  const configuredDriver = String(process.env.MEDIA_DELIVERY_DRIVER || '')
    .trim()
    .toLowerCase();

  if (configuredDriver) {
    if (configuredDriver !== 'local' && configuredDriver !== 'remote') {
      throw new Error(
        'MEDIA_DELIVERY_DRIVER must be either "local" or "remote".'
      );
    }

    return configuredDriver;
  }

  /*
   * Backward compatibility
   *
   * نسخه قبلی Remote Delivery را
   * با MEDIA_STORAGE_DRIVER=ftps
   * فعال می‌کرد.
   */
  const legacyDriver = String(
    process.env.MEDIA_STORAGE_DRIVER || process.env.VIDEO_STORAGE_DRIVER || ''
  )
    .trim()
    .toLowerCase();

  if (legacyDriver === 'ftps') {
    return 'remote';
  }

  /*
   * اگر Origin تعریف شده باشد ولی
   * Driver جدید هنوز تنظیم نشده باشد،
   * Remote Delivery را فعال می‌کنیم.
   */
  const hasRemoteOrigin = Boolean(
    String(process.env.MEDIA_ORIGIN_BASE_URL || '').trim()
  );

  return hasRemoteOrigin ? 'remote' : 'local';
};

const getOriginConfiguration = () => {
  const rawBaseUrl = getRequiredEnvironmentValue('MEDIA_ORIGIN_BASE_URL');

  const secret = getRequiredEnvironmentValue('MEDIA_ORIGIN_SECRET');

  if (secret.length < 32) {
    throw new Error('MEDIA_ORIGIN_SECRET must contain at least 32 characters.');
  }

  const baseUrl = new URL(rawBaseUrl);

  if (baseUrl.protocol !== 'https:') {
    throw new Error('MEDIA_ORIGIN_BASE_URL must use HTTPS.');
  }

  if (baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) {
    throw new Error('MEDIA_ORIGIN_BASE_URL contains unsupported components.');
  }

  const timeoutMs = getPositiveInteger(
    process.env.MEDIA_ORIGIN_TIMEOUT_MS,

    DEFAULT_ORIGIN_TIMEOUT_MS,

    'MEDIA_ORIGIN_TIMEOUT_MS'
  );

  return {
    baseUrl,
    secret,
    timeoutMs,
  };
};

const encodeStorageKey = (storageKey) => {
  const normalizedKey = normalizeStorageKey(storageKey);

  return normalizedKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
};

const createOriginUrl = ({ baseUrl, storageKey }) => {
  const encodedKey = encodeStorageKey(storageKey);

  const normalizedBasePath = baseUrl.pathname.replace(/\/+$/, '');

  const originUrl = new URL(baseUrl.toString());

  originUrl.pathname = `${normalizedBasePath}/${encodedKey}`;

  originUrl.search = '';
  originUrl.hash = '';

  return originUrl;
};

const createAbortContext = ({ requestSignal, timeoutMs }) => {
  const controller = new AbortController();

  let requestAbortHandler = null;

  if (requestSignal) {
    requestAbortHandler = () => {
      controller.abort(requestSignal.reason);
    };

    if (requestSignal.aborted) {
      requestAbortHandler();
    } else {
      requestSignal.addEventListener('abort', requestAbortHandler, {
        once: true,
      });
    }
  }

  const timeout = setTimeout(() => {
    controller.abort(
      new Error(`Media origin request timed out after ${timeoutMs} ms.`)
    );
  }, timeoutMs);

  timeout.unref?.();

  return {
    signal: controller.signal,

    dispose: () => {
      clearTimeout(timeout);

      if (requestSignal && requestAbortHandler) {
        requestSignal.removeEventListener('abort', requestAbortHandler);
      }
    },
  };
};

/*
 * این تابع دیگر MEDIA_STORAGE_DRIVER
 * را Driver اصلی Delivery نمی‌داند.
 */
export const usesRemoteMediaOrigin = () => {
  return getDeliveryDriver() === 'remote';
};

export async function fetchRemoteMediaOrigin({
  storageKey,
  method = 'GET',
  range = null,
  requestSignal = null,
}) {
  const normalizedMethod = String(method || 'GET')
    .trim()
    .toUpperCase();

  if (normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD') {
    throw new Error('Remote media origin only supports GET and HEAD.');
  }

  if (range !== null && !/^bytes=\d*-\d*$/i.test(String(range).trim())) {
    throw new Error('Invalid remote media byte range.');
  }

  const configuration = getOriginConfiguration();

  const originUrl = createOriginUrl({
    baseUrl: configuration.baseUrl,

    storageKey,
  });

  const headers = new Headers();

  /*
   * این Header بعداً می‌تواند
   * روی هاست دانلود برای جلوگیری
   * از دسترسی مستقیم بررسی شود.
   */
  headers.set(ORIGIN_AUTH_HEADER, configuration.secret);

  if (range) {
    headers.set('Range', String(range).trim());
  }

  const abortContext = createAbortContext({
    requestSignal,

    timeoutMs: configuration.timeoutMs,
  });

  try {
    const response = await fetch(originUrl, {
      method: normalizedMethod,

      headers,

      cache: 'no-store',

      redirect: 'manual',

      signal: abortContext.signal,
    });

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel().catch(() => {});

      throw new Error(
        `Media origin returned an unexpected redirect with status ${response.status}.`
      );
    }

    return response;
  } finally {
    abortContext.dispose();
  }
}
