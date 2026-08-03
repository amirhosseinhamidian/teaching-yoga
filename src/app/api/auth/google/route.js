import { NextResponse } from 'next/server';

import {
  attachGoogleOAuthCookies,
  createGoogleOAuthRequest,
  getApplicationBaseUrl,
  getGoogleOAuthConfiguration,
} from '@/server/auth/google-oauth';

import { logError } from '@/server/logger';

import { getRequestLogger } from '@/server/logger/request-context';

import { withApiLogging } from '@/server/logger/with-api-logging';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const redirectToLogin = (request, errorCode) => {
  const loginUrl = new URL('/login', getApplicationBaseUrl(request));

  loginUrl.searchParams.set('error', errorCode);

  return NextResponse.redirect(loginUrl);
};

const handleGet = async (request) => {
  const log = getRequestLogger({
    component: 'google-oauth-start',
  });

  try {
    const { clientId, redirectUri } = getGoogleOAuthConfiguration();

    const { state, codeVerifier, codeChallenge } = createGoogleOAuthRequest();

    const authorizationUrl = new URL(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );

    authorizationUrl.searchParams.set('client_id', clientId);

    authorizationUrl.searchParams.set('redirect_uri', redirectUri);

    authorizationUrl.searchParams.set('response_type', 'code');

    authorizationUrl.searchParams.set('scope', 'openid email profile');

    authorizationUrl.searchParams.set('state', state);

    authorizationUrl.searchParams.set('code_challenge', codeChallenge);

    authorizationUrl.searchParams.set('code_challenge_method', 'S256');

    authorizationUrl.searchParams.set('access_type', 'online');

    authorizationUrl.searchParams.set('include_granted_scopes', 'true');

    authorizationUrl.searchParams.set('prompt', 'select_account');

    const response = NextResponse.redirect(authorizationUrl);

    attachGoogleOAuthCookies(response, {
      state,
      codeVerifier,
    });

    log.info(
      {
        event: 'google_oauth_started',
      },

      'Google OAuth authorization started'
    );

    return response;
  } catch (error) {
    logError({
      log,
      error,

      message: 'Google OAuth start failed',

      data: {
        event: 'google_oauth_start_failed',
      },
    });

    return redirectToLogin(request, 'google_configuration');
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/auth/google',

  component: 'google-oauth-start-api',
});
