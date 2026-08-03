import 'server-only';

import path from 'node:path';

import { createReadStream } from 'node:fs';

import { readFile, stat } from 'node:fs/promises';

import { Readable } from 'node:stream';

import { normalizeStorageKey } from '@/server/storage';

import { resolveLocalVideoPath } from '@/server/storage/local-storage';

import { createProtectedSessionMediaUrl } from './session-media-token';

const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;

const CONTENT_TYPES = {
  '.m3u8': 'application/vnd.apple.mpegurl',

  '.ts': 'video/mp2t',

  '.m4s': 'video/iso.segment',

  '.mp4': 'video/mp4',

  '.webm': 'video/webm',

  '.mp3': 'audio/mpeg',

  '.m4a': 'audio/mp4',

  '.aac': 'audio/aac',

  '.wav': 'audio/wav',

  '.ogg': 'audio/ogg',

  '.oga': 'audio/ogg',

  '.vtt': 'text/vtt; charset=utf-8',

  '.key': 'application/octet-stream',
};

const getContentType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  return CONTENT_TYPES[extension] || 'application/octet-stream';
};

const createBaseHeaders = ({ contentType }) => {
  const headers = new Headers();

  headers.set('Content-Type', contentType);

  headers.set('Accept-Ranges', 'bytes');

  headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');

  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  headers.set('X-Content-Type-Options', 'nosniff');

  return headers;
};

const parseByteRange = (rangeHeader, fileSize) => {
  if (!rangeHeader) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());

  if (!match) {
    return false;
  }

  const startText = match[1];

  const endText = match[2];

  if (!startText && !endText) {
    return false;
  }

  let start;
  let end;

  if (!startText) {
    const suffixLength = Number(endText);

    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      return false;
    }

    start = Math.max(fileSize - suffixLength, 0);

    end = fileSize - 1;
  } else {
    start = Number(startText);

    end = endText ? Number(endText) : fileSize - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return false;
  }

  end = Math.min(end, fileSize - 1);

  return {
    start,
    end,
  };
};

const isUnsafeManifestReference = (value) => {
  const reference = String(value || '').trim();

  return (
    !reference ||
    reference.startsWith('/') ||
    reference.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(reference)
  );
};

const removeQueryAndHash = (value) => {
  const text = String(value);

  const queryIndex = text.indexOf('?');

  const hashIndex = text.indexOf('#');

  const indexes = [queryIndex, hashIndex].filter((index) => index >= 0);

  if (!indexes.length) {
    return text;
  }

  return text.slice(0, Math.min(...indexes));
};

const resolveManifestReference = ({ currentAssetPath, reference }) => {
  if (isUnsafeManifestReference(reference)) {
    throw new Error('Unsafe HLS manifest reference.');
  }

  const cleanReference = removeQueryAndHash(reference);

  const currentDirectory = path.posix.dirname(currentAssetPath);

  const resolved = path.posix.normalize(
    path.posix.join(currentDirectory, cleanReference)
  );

  if (
    resolved === '..' ||
    resolved.startsWith('../') ||
    path.posix.isAbsolute(resolved)
  ) {
    throw new Error('HLS manifest reference escapes its media directory.');
  }

  return resolved;
};

const rewriteHlsManifest = ({
  manifest,
  sessionId,
  token,
  currentAssetPath,
}) => {
  const buildUrl = (reference) => {
    const resolvedPath = resolveManifestReference({
      currentAssetPath,
      reference,
    });

    return createProtectedSessionMediaUrl({
      sessionId,
      mediaType: 'VIDEO',
      token,
      assetPath: resolvedPath,
    });
  };

  return manifest
    .split(/\r?\n/)
    .map((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return line;
      }

      /*
       * خطوط URI معمولی؛ مانند:
       * 720p/index.m3u8
       * segment-001.ts
       */
      if (!trimmedLine.startsWith('#')) {
        return buildUrl(trimmedLine);
      }

      /*
       * Attributeهای URI داخل Tagهایی مانند:
       * EXT-X-MAP
       * EXT-X-KEY
       * EXT-X-MEDIA
       * EXT-X-I-FRAME-STREAM-INF
       */
      return line.replace(
        /URI="([^"]+)"/g,
        (_fullMatch, reference) => `URI="${buildUrl(reference)}"`
      );
    })
    .join('\n');
};

export const resolveVideoAssetStorageKey = ({
  masterStorageKey,
  assetPath,
}) => {
  const normalizedMasterKey = normalizeStorageKey(masterStorageKey);

  if (normalizedMasterKey.split('/')[0] !== 'videos') {
    throw new Error('Invalid video storage root.');
  }

  const baseDirectory = path.posix.dirname(normalizedMasterKey);

  const normalizedAssetPath = path.posix.normalize(String(assetPath || ''));

  if (
    !normalizedAssetPath ||
    normalizedAssetPath === '.' ||
    normalizedAssetPath === '..' ||
    normalizedAssetPath.startsWith('../') ||
    path.posix.isAbsolute(normalizedAssetPath)
  ) {
    throw new Error('Invalid protected video asset path.');
  }

  const candidateKey = normalizeStorageKey(
    path.posix.join(baseDirectory, normalizedAssetPath)
  );

  if (
    candidateKey !== baseDirectory &&
    !candidateKey.startsWith(`${baseDirectory}/`)
  ) {
    throw new Error('Protected video asset escapes its media directory.');
  }

  return candidateKey;
};

export async function serveProtectedMedia({
  request,
  storageKey,
  includeBody,
  manifestContext = null,
}) {
  const filePath = resolveLocalVideoPath(storageKey);

  const fileStats = await stat(filePath);

  if (!fileStats.isFile()) {
    return new Response('File not found.', {
      status: 404,
    });
  }

  const contentType = getContentType(filePath);

  const extension = path.extname(filePath).toLowerCase();

  /*
   * Manifest باید بازنویسی شود تا تمام Variantها
   * و Segmentها Token را با خود حمل کنند.
   */
  if (extension === '.m3u8' && manifestContext) {
    if (fileStats.size > MAX_MANIFEST_BYTES) {
      throw new Error('HLS manifest is unexpectedly large.');
    }

    const manifest = await readFile(filePath, 'utf8');

    const rewrittenManifest = rewriteHlsManifest({
      manifest,

      sessionId: manifestContext.sessionId,

      token: manifestContext.token,

      currentAssetPath: manifestContext.currentAssetPath,
    });

    const responseBuffer = Buffer.from(rewrittenManifest, 'utf8');

    const headers = createBaseHeaders({
      contentType,
    });

    headers.set('Content-Length', String(responseBuffer.length));

    if (!includeBody) {
      return new Response(null, {
        status: 200,
        headers,
      });
    }

    return new Response(responseBuffer, {
      status: 200,
      headers,
    });
  }

  const fileSize = fileStats.size;

  const range = parseByteRange(request.headers.get('range'), fileSize);

  if (range === false) {
    return new Response(null, {
      status: 416,

      headers: {
        'Content-Range': `bytes */${fileSize}`,

        'Accept-Ranges': 'bytes',

        'Cache-Control': 'private, no-store',

        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  const headers = createBaseHeaders({
    contentType,
  });

  if (range) {
    const contentLength = range.end - range.start + 1;

    headers.set('Content-Length', String(contentLength));

    headers.set(
      'Content-Range',
      `bytes ${range.start}-${range.end}/${fileSize}`
    );

    if (!includeBody) {
      return new Response(null, {
        status: 206,
        headers,
      });
    }

    const nodeStream = createReadStream(filePath, {
      start: range.start,

      end: range.end,
    });

    return new Response(Readable.toWeb(nodeStream), {
      status: 206,
      headers,
    });
  }

  headers.set('Content-Length', String(fileSize));

  if (!includeBody) {
    return new Response(null, {
      status: 200,
      headers,
    });
  }

  const nodeStream = createReadStream(filePath);

  return new Response(Readable.toWeb(nodeStream), {
    status: 200,
    headers,
  });
}
