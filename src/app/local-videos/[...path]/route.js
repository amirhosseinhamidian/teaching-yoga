import path from 'node:path';

import { createReadStream } from 'node:fs';

import { stat } from 'node:fs/promises';

import { Readable } from 'node:stream';

import { normalizeStorageKey } from '@/server/storage';

import { resolveLocalVideoPath } from '@/server/storage/local-storage';
import { logError, createChildLogger } from '@/server/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicMediaLogger = createChildLogger({
  component: 'public-local-media',
});

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

  '.jpg': 'image/jpeg',

  '.jpeg': 'image/jpeg',

  '.png': 'image/png',

  '.gif': 'image/gif',

  '.webp': 'image/webp',

  '.svg': 'image/svg+xml',

  '.vtt': 'text/vtt; charset=utf-8',

  '.key': 'application/octet-stream',
};

const getContentType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  return CONTENT_TYPES[extension] || 'application/octet-stream';
};

const isPublicStorageKey = (storageKey) => {
  const segments = storageKey.split('/');

  if (segments.some((segment) => !segment || segment.startsWith('.'))) {
    return false;
  }

  const root = segments[0];

  /*
   * تصاویر و پادکست‌ها عمومی هستند.
   */
  if (root === 'images' || root === 'podcast') {
    return true;
  }

  /*
   * فقط ویدئوی معرفی دوره عمومی است:
   *
   * videos/<course-title>/intro/master.m3u8
   * videos/<course-title>/intro/<job-id>/master.m3u8
   *
   * ویدئوهای جلسه ساختار زیر دارند و رد می‌شوند:
   *
   * videos/<term-id>/<session-id>/...
   */
  if (root === 'videos' && segments.length >= 4 && segments[2] === 'intro') {
    return true;
  }

  /*
   * ریشه audio فقط برای جلسات است
   * و باید از Protected Route ارائه شود.
   */
  return false;
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

const createBaseHeaders = ({ contentType }) => {
  const headers = new Headers();

  headers.set('Content-Type', contentType);

  headers.set('Accept-Ranges', 'bytes');

  headers.set('Cache-Control', 'public, max-age=300');

  headers.set('Access-Control-Allow-Origin', '*');

  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  headers.set('Access-Control-Allow-Headers', 'Range, Content-Type');

  headers.set(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, Accept-Ranges'
  );

  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  headers.set('X-Content-Type-Options', 'nosniff');

  return headers;
};

const getStorageKey = async (context) => {
  const params = await context.params;

  if (!Array.isArray(params?.path) || params.path.length === 0) {
    return null;
  }

  try {
    return normalizeStorageKey(params.path.join('/'));
  } catch {
    return null;
  }
};

const serveMedia = async ({ request, context, includeBody }) => {
  let storageKey = null;
  try {
    storageKey = await getStorageKey(context);

    if (!storageKey || !isPublicStorageKey(storageKey)) {
      return new Response('File not found.', {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    const filePath = resolveLocalVideoPath(storageKey);

    const fileStats = await stat(filePath);

    if (!fileStats.isFile()) {
      return new Response('File not found.', {
        status: 404,
      });
    }

    const fileSize = fileStats.size;

    const contentType = getContentType(filePath);

    const range = parseByteRange(request.headers.get('range'), fileSize);

    if (range === false) {
      return new Response(null, {
        status: 416,

        headers: {
          'Content-Range': `bytes */${fileSize}`,

          'Accept-Ranges': 'bytes',

          'Cache-Control': 'no-store',
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
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') {
      logError({
        log: publicMediaLogger,
        error,
        message: 'Public local media delivery failed',
        data: {
          event: 'public_local_media_delivery_failed',
          storageKey,
          method: request.method,
        },
      });
    } else {
      publicMediaLogger.debug(
        {
          event: 'public_local_media_not_found',
          storageKey,
          errorCode: error?.code || null,
        },
        'Public local media file was not found'
      );
    }

    return new Response('File not found.', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
};

export async function GET(request, context) {
  return serveMedia({
    request,
    context,
    includeBody: true,
  });
}

export async function HEAD(request, context) {
  return serveMedia({
    request,
    context,
    includeBody: false,
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,

    headers: {
      'Access-Control-Allow-Origin': '*',

      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',

      'Access-Control-Allow-Headers': 'Range, Content-Type',

      'Access-Control-Max-Age': '86400',
    },
  });
}
