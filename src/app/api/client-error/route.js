import { NextResponse } from 'next/server';

import { getAuthUser } from '@/utils/getAuthUser';

import { sanitizeLogData } from '@/server/logger/sanitize-log-data';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const RATE_LIMIT_MAX_REPORTS = 30;

const RATE_LIMIT_KEY = Symbol.for('teaching-yoga.client-error-rate-limit');

if (!globalThis[RATE_LIMIT_KEY]) {
  globalThis[RATE_LIMIT_KEY] = new Map();
}

const rateLimitStore = globalThis[RATE_LIMIT_KEY];

const sanitizeText = (value, maxLength) => {
  return String(value ?? '')
    .normalize('NFC')
    .trim()
    .slice(0, maxLength)
    .replace(/https?:\/\/[^\s?#]+(?:\?[^\s#]*)?/gi, '[URL]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[JWT]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/(?:\+98|0098|98|0)?9\d{9}\b/g, '[PHONE]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[NUMBER]');
};

const normalizeIdentifier = (value, fallback) => {
  const identifier = String(value || '')
    .trim()
    .slice(0, 120);

  if (!/^[a-zA-Z0-9_.:-]+$/.test(identifier)) {
    return fallback;
  }

  return identifier;
};

const getRateLimitIdentity = (request) => {
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim();

  return forwarded || request.headers.get('x-real-ip') || 'unknown';
};

const isRateLimited = (identity) => {
  const now = Date.now();

  const current = rateLimitStore.get(identity);

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(identity, {
      startedAt: now,
      count: 1,
    });

    return false;
  }

  current.count += 1;

  return current.count > RATE_LIMIT_MAX_REPORTS;
};

const handlePost = async (request) => {
  const log = getRequestLogger({
    component: 'client-error-api',
  });

  const contentLength = Number(request.headers.get('content-length') || 0);

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 413,
      }
    );
  }

  const identity = getRateLimitIdentity(request);

  if (isRateLimited(identity)) {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 429,

        headers: {
          'Retry-After': '60',
        },
      }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 400,
      }
    );
  }

  const event = normalizeIdentifier(body?.event, 'client_error');

  const component = normalizeIdentifier(
    body?.component,
    'unknown-client-component'
  );

  const severity = body?.severity === 'warn' ? 'warn' : 'error';

  const errorName = sanitizeText(body?.error?.name || 'ClientError', 100);

  const errorMessage = sanitizeText(
    body?.error?.message || 'Unknown client error',
    1000
  );

  const errorStack = body?.error?.stack
    ? sanitizeText(body.error.stack, 5000)
    : null;

  const clientPath =
    typeof body?.path === 'string' && body.path.startsWith('/')
      ? sanitizeText(body.path.split('?')[0], 500)
      : null;

  const authUser = await getAuthUser();

  const logData = {
    event: 'client_error_reported',

    clientEvent: event,

    clientComponent: component,

    clientPath,

    errorName,
    errorMessage,
    errorStack,

    userId: authUser?.id || null,

    clientData: sanitizeLogData(body?.data || {}),
  };

  log[severity](
    logData,
    severity === 'warn' ? 'Client warning reported' : 'Client error reported'
  );

  return NextResponse.json(
    {
      success: true,
    },
    {
      status: 202,

      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
};

export const POST = withApiLogging(handlePost, {
  route: '/api/client-error',

  component: 'client-error-api',

  logSuccess: false,
});
