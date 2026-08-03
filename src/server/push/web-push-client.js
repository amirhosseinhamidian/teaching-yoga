/* eslint-disable no-undef */
import 'server-only';

import webpush from 'web-push';

const WEB_PUSH_STATE_KEY = Symbol.for('teaching-yoga.web-push-state');

if (!globalThis[WEB_PUSH_STATE_KEY]) {
  globalThis[WEB_PUSH_STATE_KEY] = {
    configured: false,
  };
}

const state = globalThis[WEB_PUSH_STATE_KEY];

export class PushConfigurationError extends Error {
  constructor(message, { code = 'PUSH_CONFIGURATION_ERROR' } = {}) {
    super(message);

    this.name = 'PushConfigurationError';

    this.code = code;
  }
}

const getRequiredEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();

  if (!value) {
    throw new PushConfigurationError(`${name} is not configured.`, {
      code: `MISSING_${name}`,
    });
  }

  return value;
};

const getVapidSubject = () => {
  const subject = String(
    process.env.VAPID_SUBJECT || 'mailto:support@samaneyoga.ir'
  ).trim();

  if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) {
    throw new PushConfigurationError(
      'VAPID_SUBJECT must start with mailto: or https://.',
      {
        code: 'INVALID_VAPID_SUBJECT',
      }
    );
  }

  return subject;
};

const configureWebPush = () => {
  if (state.configured) {
    return;
  }

  const subject = getVapidSubject();

  const publicKey = getRequiredEnvironmentValue('NEXT_PUBLIC_VAPID_PUBLIC_KEY');

  const privateKey = getRequiredEnvironmentValue('VAPID_PRIVATE_KEY');

  webpush.setVapidDetails(subject, publicKey, privateKey);

  state.configured = true;
};

export const getWebPushClient = () => {
  /*
   * این تابع فقط باید داخل Handler یا تابعی که
   * از Handler فراخوانی می‌شود اجرا شود.
   */
  configureWebPush();

  return webpush;
};
