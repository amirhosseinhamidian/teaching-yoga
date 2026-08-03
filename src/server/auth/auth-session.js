/* eslint-disable no-undef */
import 'server-only';

import { randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'auth_token';

export const AUTH_SESSION_MAX_AGE = 7 * 24 * 60 * 60;

const getJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  return secret;
};

export const createAuthToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },

    getJwtSecret(),

    {
      algorithm: 'HS256',

      expiresIn: AUTH_SESSION_MAX_AGE,

      jwtid: randomUUID(),
    }
  );
};

export const attachAuthCookie = (response, user) => {
  const token = createAuthToken(user);

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',
    maxAge: AUTH_SESSION_MAX_AGE,

    path: '/',
  });

  return response;
};

export const clearAuthCookie = (response) => {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,

    secure: process.env.NODE_ENV === 'production',

    sameSite: 'lax',

    expires: new Date(0),

    maxAge: 0,
    path: '/',
  });

  return response;
};
