/* eslint-disable no-undef */

const HTTP_URL_PATTERN = /^https?:\/\//i;

const PUBLIC_MEDIA_ROOTS = new Set(['images', 'audio', 'videos', 'podcast']);

const normalizeBaseUrl = (value, variableName) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error(`${variableName} must use http or https.`);
    }

    return parsedUrl.origin;
  } catch {
    throw new Error(`${variableName} is not a valid public URL.`);
  }
};

const getFirstConfiguredBaseUrl = (candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate.value, candidate.name);

    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const getAppPublicBaseUrl = () => {
  return (
    getFirstConfiguredBaseUrl([
      {
        name: 'APP_PUBLIC_BASE_URL',
        value: process.env.APP_PUBLIC_BASE_URL,
      },
      {
        name: 'NEXT_PUBLIC_SITE_URL',
        value: process.env.NEXT_PUBLIC_SITE_URL,
      },
      {
        name: 'NEXT_PUBLIC_API_BASE_URL',
        value: process.env.NEXT_PUBLIC_API_BASE_URL,
      },
    ]) || 'http://localhost:3000'
  );
};

export const getMediaPublicBaseUrl = () => {
  return (
    getFirstConfiguredBaseUrl([
      {
        name: 'MEDIA_PUBLIC_BASE_URL',
        value: process.env.MEDIA_PUBLIC_BASE_URL,
      },
      {
        name: 'VIDEO_PUBLIC_BASE_URL',
        value: process.env.VIDEO_PUBLIC_BASE_URL,
      },
      {
        name: 'APP_PUBLIC_BASE_URL',
        value: process.env.APP_PUBLIC_BASE_URL,
      },
      {
        name: 'NEXT_PUBLIC_API_BASE_URL',
        value: process.env.NEXT_PUBLIC_API_BASE_URL,
      },
    ]) || 'http://localhost:3000'
  );
};

const normalizeAbsoluteUrl = (value) => {
  const parsedUrl = new URL(value);

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.');
  }

  return parsedUrl.toString();
};

const splitPathSuffix = (value) => {
  const match = String(value).match(/^([^?#]*)([?#].*)?$/);

  return {
    pathname: match?.[1] || '',

    suffix: match?.[2] || '',
  };
};

const normalizeInternalPath = (value, { validateMediaRoot = false } = {}) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  if (rawValue.startsWith('//')) {
    throw new Error('Protocol-relative URLs are not supported.');
  }

  const { pathname, suffix } = splitPathSuffix(rawValue);

  let normalizedPath = pathname
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '');

  if (normalizedPath.startsWith('local-videos/')) {
    normalizedPath = normalizedPath.slice('local-videos/'.length);
  }

  const segments = normalizedPath.split('/').filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error('Invalid internal path.');
  }

  if (validateMediaRoot) {
    const rootDirectory = segments[0];

    if (!PUBLIC_MEDIA_ROOTS.has(rootDirectory)) {
      throw new Error(`Unsupported media root: ${rootDirectory}`);
    }
  }

  return {
    pathname: `/${segments.join('/')}`,

    suffix,
  };
};

export const toAbsoluteAppUrl = (value) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  if (HTTP_URL_PATTERN.test(rawValue)) {
    return normalizeAbsoluteUrl(rawValue);
  }

  const normalized = normalizeInternalPath(rawValue);

  return new URL(
    `${normalized.pathname}${normalized.suffix}`,
    `${getAppPublicBaseUrl()}/`
  ).toString();
};

export const toAbsoluteMediaUrl = (value, { allowExternal = true } = {}) => {
  const rawValue = typeof value === 'string' ? value.trim() : '';

  if (!rawValue) {
    return null;
  }

  if (HTTP_URL_PATTERN.test(rawValue)) {
    if (!allowExternal) {
      const parsedUrl = new URL(rawValue);

      const allowedOrigins = new Set([
        getAppPublicBaseUrl(),
        getMediaPublicBaseUrl(),
      ]);

      if (!allowedOrigins.has(parsedUrl.origin)) {
        throw new Error('External media URLs are not allowed.');
      }
    }

    return normalizeAbsoluteUrl(rawValue);
  }

  const normalized = normalizeInternalPath(rawValue, {
    validateMediaRoot: true,
  });

  return new URL(
    `${normalized.pathname}${normalized.suffix}`,
    `${getMediaPublicBaseUrl()}/`
  ).toString();
};

export const toOpenGraphImages = (imageValue, alt = '') => {
  const imageUrl = toAbsoluteMediaUrl(imageValue);

  if (!imageUrl) {
    return [];
  }

  return [
    {
      url: imageUrl,
      alt: typeof alt === 'string' ? alt : '',
    },
  ];
};

export const getMetadataBase = () => {
  return new URL(getAppPublicBaseUrl());
};
