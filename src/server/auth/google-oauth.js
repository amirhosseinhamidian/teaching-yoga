/* eslint-disable no-undef */
import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const GOOGLE_OAUTH_STATE_COOKIE = 'google_oauth_state';

export const GOOGLE_OAUTH_VERIFIER_COOKIE = 'google_oauth_verifier';

const GOOGLE_OAUTH_COOKIE_MAX_AGE = 10 * 60;

const GOOGLE_OAUTH_COOKIE_PATH = '/api/auth/google';

const getRequiredEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};

export const getGoogleOAuthConfiguration = () => {
  return {
    clientId: getRequiredEnvironmentValue('GOOGLE_CLIENT_ID'),

    clientSecret: getRequiredEnvironmentValue('GOOGLE_CLIENT_SECRET'),

    redirectUri: getRequiredEnvironmentValue('GOOGLE_REDIRECT_URI'),
  };
};

const toBase64Url = (buffer) => {
  return buffer.toString('base64url');
};

export const createGoogleOAuthRequest = () => {
  const state = toBase64Url(randomBytes(32));

  /*
   * Code Verifier باید مقدار تصادفی و غیرقابل حدس باشد.
   * خروجی 64 بایت، در قالب Base64URL حدود 86 کاراکتر است.
   */
  const codeVerifier = toBase64Url(randomBytes(64));

  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  return {
    state,
    codeVerifier,
    codeChallenge,
  };
};

const safeEqual = (first, second) => {
  if (
    typeof first !== 'string' ||
    typeof second !== 'string' ||
    !first ||
    !second
  ) {
    return false;
  }

  const firstBuffer = Buffer.from(first);

  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
};

export const isGoogleOAuthStateValid = ({ receivedState, storedState }) => {
  return safeEqual(receivedState, storedState);
};

const getOAuthCookieOptions = () => {
  return {
    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',

    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,

    path: GOOGLE_OAUTH_COOKIE_PATH,
  };
};

export const attachGoogleOAuthCookies = (response, { state, codeVerifier }) => {
  const options = getOAuthCookieOptions();

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, options);

  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, codeVerifier, options);

  return response;
};

export const clearGoogleOAuthCookies = (response) => {
  const options = {
    ...getOAuthCookieOptions(),

    expires: new Date(0),
    maxAge: 0,
  };

  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', options);

  response.cookies.set(GOOGLE_OAUTH_VERIFIER_COOKIE, '', options);

  return response;
};

export const getApplicationBaseUrl = (request) => {
  const configuredBaseUrl = String(
    process.env.NEXT_PUBLIC_API_BASE_URL || ''
  ).trim();

  if (configuredBaseUrl) {
    return new URL(configuredBaseUrl);
  }

  return new URL(request.nextUrl.origin);
};
