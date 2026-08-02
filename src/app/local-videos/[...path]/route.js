import path from 'node:path';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';

import { resolveLocalVideoPath } from '@/server/storage/local-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTENT_TYPES = {
  // HLS و ویدئو
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4s': 'video/iso.segment',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',

  // صوت
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',

  // تصویر
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',

  // سایر فایل‌های HLS
  '.key': 'application/octet-stream',
};

const getContentType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  return CONTENT_TYPES[extension] || 'application/octet-stream';
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

  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  headers.set('Access-Control-Allow-Origin', '*');

  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  headers.set('Access-Control-Allow-Headers', 'Range, Content-Type');

  headers.set(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, Accept-Ranges'
  );

  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  return headers;
};

const getStorageKey = async (context) => {
  const params = await context.params;

  if (!Array.isArray(params?.path) || params.path.length === 0) {
    return null;
  }

  return params.path.join('/');
};

const serveMedia = async ({ request, context, includeBody }) => {
  try {
    const storageKey = await getStorageKey(context);

    if (!storageKey) {
      return new Response('File not found.', {
        status: 404,
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

          'Access-Control-Allow-Origin': '*',
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

      const webStream = Readable.toWeb(nodeStream);

      return new Response(webStream, {
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

    const webStream = Readable.toWeb(nodeStream);

    return new Response(webStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    if (error?.code !== 'ENOENT' && error?.code !== 'EISDIR') {
      console.error('[local-media] Delivery error:', error);
    }

    return new Response('File not found.', {
      status: 404,
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
