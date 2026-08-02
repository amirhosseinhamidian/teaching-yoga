/* eslint-disable no-undef */

import { NextResponse } from 'next/server';

import { getMediaStorage, normalizeStorageKey } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HTTP_URL_PATTERN = /^https?:\/\//i;

const getAllowedOrigins = () => {
  const values = [
    process.env.MEDIA_PUBLIC_BASE_URL,

    process.env.VIDEO_PUBLIC_BASE_URL,
  ];

  const origins = new Set();

  for (const value of values) {
    if (!value) {
      continue;
    }

    try {
      origins.add(new URL(value).origin);
    } catch {
      // متغیر نامعتبر نادیده گرفته می‌شود.
    }
  }

  return origins;
};

const resolveAudioUrl = (value) => {
  const source = typeof value === 'string' ? value.trim() : '';

  if (!source) {
    throw new Error('MISSING_AUDIO_SOURCE');
  }

  if (HTTP_URL_PATTERN.test(source)) {
    const parsedUrl = new URL(source);

    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins.size > 0 && !allowedOrigins.has(parsedUrl.origin)) {
      throw new Error('AUDIO_ORIGIN_NOT_ALLOWED');
    }

    return parsedUrl.toString();
  }

  const audioKey = normalizeStorageKey(source.replace(/^\/+/, ''));

  if (!audioKey.startsWith('audio/') && !audioKey.startsWith('podcast/')) {
    throw new Error('INVALID_AUDIO_PATH');
  }

  return getMediaStorage().getPublicUrl(audioKey);
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const source = searchParams.get('url');

  try {
    const audioUrl = resolveAudioUrl(source);

    const range = request.headers.get('range');

    const requestHeaders = new Headers();

    if (range) {
      requestHeaders.set('Range', range);
    }

    const externalResponse = await fetch(audioUrl, {
      method: 'GET',

      headers: requestHeaders,

      cache: 'no-store',

      redirect: 'follow',
    });

    if (!externalResponse.ok && externalResponse.status !== 206) {
      console.error('[audio-proxy] Upstream error:', {
        audioUrl,
        status: externalResponse.status,
      });

      return NextResponse.json(
        {
          error: 'فایل صوتی قابل دریافت نیست.',
        },
        {
          status: externalResponse.status,
        }
      );
    }

    const responseHeaders = new Headers();

    const forwardedHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified',
      'cache-control',
    ];

    for (const headerName of forwardedHeaders) {
      const headerValue = externalResponse.headers.get(headerName);

      if (headerValue) {
        responseHeaders.set(headerName, headerValue);
      }
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');

    responseHeaders.set(
      'Access-Control-Expose-Headers',
      'Content-Length, Content-Range, Accept-Ranges'
    );

    if (!responseHeaders.has('Accept-Ranges')) {
      responseHeaders.set('Accept-Ranges', 'bytes');
    }

    return new Response(externalResponse.body, {
      status: externalResponse.status,

      headers: responseHeaders,
    });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : '';

    if (errorCode === 'MISSING_AUDIO_SOURCE') {
      return NextResponse.json(
        {
          error: 'آدرس فایل صوتی ارسال نشده است.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      errorCode === 'AUDIO_ORIGIN_NOT_ALLOWED' ||
      errorCode === 'INVALID_AUDIO_PATH'
    ) {
      return NextResponse.json(
        {
          error: 'مسیر فایل صوتی مجاز نیست.',
        },
        {
          status: 403,
        }
      );
    }

    console.error('[audio-proxy] Error:', error);

    return NextResponse.json(
      {
        error: 'خطا در دریافت فایل صوتی.',
      },
      {
        status: 500,
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,

    headers: {
      'Access-Control-Allow-Origin': '*',

      'Access-Control-Allow-Methods': 'GET, OPTIONS',

      'Access-Control-Allow-Headers': 'Range, Content-Type',

      'Access-Control-Max-Age': '86400',
    },
  });
}
