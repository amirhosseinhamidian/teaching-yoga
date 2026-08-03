/* eslint-disable no-undef */

import { NextResponse } from 'next/server';

import { jwtVerify } from 'jose';

import { PUBLIC, PURCHASED, REGISTERED } from './constants/videoAccessLevel';

import { edgeLogger } from './server/logger/edge-logger';

const JWT_SECRET = process.env.JWT_SECRET;

const attachRequestId = (response, requestId) => {
  try {
    response.headers.set('x-request-id', requestId);
  } catch {
    // Response غیرقابل تغییر
  }

  return response;
};

const getRequestId = (request) => {
  const incomingRequestId = request.headers.get('x-request-id')?.trim();

  if (incomingRequestId && incomingRequestId.length <= 128) {
    return incomingRequestId;
  }

  return crypto.randomUUID();
};

async function getUserFromJWT(request, log) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (typeof payload.id !== 'string') {
      return null;
    }

    return {
      userId: payload.id,

      role: typeof payload.role === 'string' ? payload.role : 'USER',
    };
  } catch (error) {
    /*
     * Token منقضی یا نامعتبر یک وضعیت معمول است؛
     * در سطح debug ثبت می‌شود.
     */
    log.debug(
      {
        event: 'middleware_auth_token_rejected',

        error,
      },

      'Middleware authentication token was rejected'
    );

    return null;
  }
}

const isAdminOrManager = (user) => {
  return Boolean(
    user?.userId && (user.role === 'ADMIN' || user.role === 'MANAGER')
  );
};

async function handleAdminRoutes(request, user) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/a-panel') && !isAdminOrManager(user)) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return null;
}

async function handleProtectedRoutes(request, user) {
  const protectedRoutes = ['/profile'];

  const path = request.nextUrl.pathname;

  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return null;
}

async function handleAccessDeniedRoutes(request, user) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/payment') && !user) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return null;
}

async function handleLessonMediaAccess(request, user, log) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/courses/') || !pathname.includes('/lesson/')) {
    return null;
  }

  const pathSegments = pathname.split('/');

  const shortAddress = pathSegments[2];

  const sessionId = pathSegments[4];

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin;

    const mediaUrl = new URL('/api/check-media-access', baseUrl);

    mediaUrl.searchParams.set('sessionId', sessionId);

    const mediaResponse = await fetch(mediaUrl, {
      cache: 'no-store',
    });

    if (mediaResponse.status !== 200) {
      return NextResponse.redirect(
        new URL(`/courses/${shortAddress}`, request.url)
      );
    }

    const media = await mediaResponse.json();

    if (media.accessLevel === PUBLIC) {
      return null;
    }

    if (media.accessLevel === REGISTERED && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (media.accessLevel === PURCHASED) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const purchaseUrl = new URL('/api/check-purchase', baseUrl);

      purchaseUrl.searchParams.set('userId', user.userId);

      purchaseUrl.searchParams.set('shortAddress', shortAddress);

      const purchaseResponse = await fetch(purchaseUrl, {
        cache: 'no-store',
      });

      const data = await purchaseResponse.json().catch(() => null);

      if (purchaseResponse.status === 200 && data?.hasAccess) {
        return null;
      }

      if (purchaseResponse.status >= 500) {
        return NextResponse.redirect(new URL('/error', request.url));
      }

      return NextResponse.redirect(
        new URL(`/courses/${shortAddress}`, request.url)
      );
    }
  } catch (error) {
    log.error(
      {
        event: 'middleware_media_access_failed',

        sessionId: sessionId || null,

        error,
      },

      'Middleware lesson media access check failed'
    );

    return NextResponse.redirect(new URL('/error', request.url));
  }

  return null;
}

async function handleShopRoutes(request, user, log) {
  const path = request.nextUrl.pathname;

  const isShopUI = path === '/shop' || path.startsWith('/shop/');

  if (!isShopUI) {
    return null;
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin;

    const statusUrl = new URL('/api/shop/status', baseUrl);

    const response = await fetch(statusUrl, {
      cache: 'no-store',

      headers: {
        'x-from-middleware': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Shop status HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));

    const shopVisibility = String(data?.shopVisibility || 'ALL').toUpperCase();

    if (shopVisibility === 'OFF') {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    if (shopVisibility === 'ADMIN_ONLY' && !isAdminOrManager(user)) {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }

    return null;
  } catch (error) {
    log.error(
      {
        event: 'middleware_shop_visibility_failed',

        error,
      },

      'Middleware shop visibility check failed'
    );

    /*
     * Fail closed:
     * در صورت شکست API، فروشگاه نمایش داده نمی‌شود.
     */
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const requestId = getRequestId(request);

  const log = edgeLogger.child({
    requestId,

    method: request.method,

    path,
  });

  const user = await getUserFromJWT(request, log);

  const handlers = [
    handleShopRoutes,
    handleAdminRoutes,
    handleProtectedRoutes,
    handleAccessDeniedRoutes,
    handleLessonMediaAccess,
  ];

  for (const handler of handlers) {
    const result = await handler(request, user, log);

    if (result) {
      return attachRequestId(result, requestId);
    }
  }

  return attachRequestId(NextResponse.next(), requestId);
}

export const config = {
  matcher: [
    '/profile',
    '/a-panel/:path*',
    '/payment',
    '/courses/:path*',
    '/shop/:path*',
    '/shop',
  ],
};
