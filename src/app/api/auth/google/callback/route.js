import { createHash, randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { attachAuthCookie } from '@/server/auth/auth-session';

import {
  clearGoogleOAuthCookies,
  getApplicationBaseUrl,
  getGoogleOAuthConfiguration,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_VERIFIER_COOKIE,
  isGoogleOAuthStateValid,
} from '@/server/auth/google-oauth';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  firstname: true,
  lastname: true,
  phone: true,
  email: true,
  avatar: true,
  role: true,
};

class GoogleOAuthError extends Error {
  constructor(message, code) {
    super(message);

    this.name = 'GoogleOAuthError';

    this.code = code;
  }
}

const createRedirect = (request, path) => {
  return NextResponse.redirect(new URL(path, getApplicationBaseUrl(request)));
};

const createFinalRedirect = (request, path) => {
  const response = createRedirect(request, path);

  clearGoogleOAuthCookies(response);

  return response;
};

const createGoogleUsername = ({ givenName, subject, attempt }) => {
  const normalizedBase =
    String(givenName || 'user')
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 30) || 'user';

  const source = `${subject}:${attempt}`;

  const suffix = createHash('sha256').update(source).digest('hex').slice(0, 10);

  return `${normalizedBase}_${suffix}`;
};

const findOrCreateGoogleUser = async (googleUser) => {
  const existingUser = await prismadb.user.findUnique({
    where: {
      email: googleUser.email,
    },

    select: SAFE_USER_SELECT,
  });

  if (existingUser) {
    return {
      user: existingUser,

      created: false,
    };
  }

  const subject = String(googleUser.sub || googleUser.email || randomUUID());

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const username = createGoogleUsername({
      givenName: googleUser.given_name,

      subject,
      attempt,
    });

    try {
      const user = await prismadb.user.create({
        data: {
          email: googleUser.email,

          username,

          firstname: googleUser.given_name || '',

          lastname: googleUser.family_name || '',

          avatar: googleUser.picture || null,

          phone: null,
          role: 'USER',
        },

        select: SAFE_USER_SELECT,
      });

      return {
        user,
        created: true,
      };
    } catch (error) {
      if (error?.code !== 'P2002') {
        throw error;
      }

      /*
       * ممکن است درخواست موازی همان ایمیل را ساخته باشد.
       */
      const racedUser = await prismadb.user.findUnique({
        where: {
          email: googleUser.email,
        },

        select: SAFE_USER_SELECT,
      });

      if (racedUser) {
        return {
          user: racedUser,

          created: false,
        };
      }
    }
  }

  throw new GoogleOAuthError(
    'Unable to create a unique Google user.',
    'GOOGLE_USER_CREATE_FAILED'
  );
};

const fetchJsonWithTimeout = async (url, options, timeoutMs = 10000) => {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,

      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    return {
      response,
      data,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const handleGet = async (request) => {
  const log = getRequestLogger({
    component: 'google-oauth-callback',
  });

  const providerError = request.nextUrl.searchParams.get('error');

  if (providerError) {
    log.warn(
      {
        event: 'google_oauth_provider_rejected',

        providerError: String(providerError).slice(0, 100),
      },

      'Google OAuth request was rejected by provider'
    );

    return createFinalRedirect(request, '/login?error=google_denied');
  }

  const code = request.nextUrl.searchParams.get('code');

  const receivedState = request.nextUrl.searchParams.get('state');

  const storedState = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  const codeVerifier = request.cookies.get(GOOGLE_OAUTH_VERIFIER_COOKIE)?.value;

  if (
    !isGoogleOAuthStateValid({
      receivedState,
      storedState,
    })
  ) {
    log.warn(
      {
        event: 'google_oauth_state_rejected',
      },

      'Google OAuth state validation failed'
    );

    return createFinalRedirect(request, '/login?error=google_state');
  }

  if (!code || !codeVerifier) {
    log.warn(
      {
        event: 'google_oauth_callback_incomplete',

        hasCode: Boolean(code),

        hasCodeVerifier: Boolean(codeVerifier),
      },

      'Google OAuth callback was incomplete'
    );

    return createFinalRedirect(request, '/login?error=google_callback');
  }

  try {
    const { clientId, clientSecret, redirectUri } =
      getGoogleOAuthConfiguration();

    const tokenResult = await fetchJsonWithTimeout(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },

        body: new URLSearchParams({
          code,

          client_id: clientId,

          client_secret: clientSecret,

          redirect_uri: redirectUri,

          grant_type: 'authorization_code',

          code_verifier: codeVerifier,
        }),

        cache: 'no-store',
      }
    );

    if (!tokenResult.response.ok || !tokenResult.data?.access_token) {
      throw new GoogleOAuthError(
        'Google token exchange failed.',
        'GOOGLE_TOKEN_EXCHANGE_FAILED'
      );
    }

    const userInfoResult = await fetchJsonWithTimeout(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        method: 'GET',

        headers: {
          Authorization: `Bearer ${tokenResult.data.access_token}`,
        },

        cache: 'no-store',
      }
    );

    const googleUser = userInfoResult.data;

    if (
      !userInfoResult.response.ok ||
      !googleUser?.email ||
      googleUser.email_verified !== true
    ) {
      throw new GoogleOAuthError(
        'Verified Google email was not returned.',
        'GOOGLE_EMAIL_NOT_VERIFIED'
      );
    }

    const { user, created } = await findOrCreateGoogleUser(googleUser);

    const response = createFinalRedirect(request, '/');

    attachAuthCookie(response, user);

    log.info(
      {
        event: 'google_oauth_succeeded',

        userId: user.id,

        role: user.role,

        userCreated: created,
      },

      'Google OAuth authentication succeeded'
    );

    return response;
  } catch (error) {
    const errorCode =
      error instanceof GoogleOAuthError ? error.code : 'GOOGLE_OAUTH_FAILED';

    logError({
      log,
      error,

      message: 'Google OAuth callback failed',

      data: {
        event: 'google_oauth_callback_failed',

        errorCode,
      },
    });

    return createFinalRedirect(request, '/login?error=google_failed');
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/auth/google/callback',

  component: 'google-oauth-callback-api',
});
