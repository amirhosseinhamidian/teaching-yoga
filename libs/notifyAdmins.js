import 'server-only';

import {
  __getSubscriptionsForKey,
  __removeSubscriptionForKey,
} from '@/app/api/push/subscribe/route';

import {
  getWebPushClient,
  PushConfigurationError,
} from '@/server/push/web-push-client';

import { createChildLogger, logError } from '@/server/logger';

const log = createChildLogger({
  component: 'notify-admins',
});

const ADMIN_PUSH_KEY = process.env.ADMIN_PUSH_KEY || 'ADMIN_SUPPORT';

const stripHtml = (html = '') => {
  const withoutTags = String(html).replace(/<[^>]*>/g, ' ');

  return withoutTags.replace(/\s+/g, ' ').trim();
};

const normalizeUrl = (value) => {
  const fallback =
    process.env.APP_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://samaneyoga.ir';

  try {
    const baseUrl = new URL(fallback);

    if (!value) {
      return baseUrl.toString();
    }

    return new URL(String(value), baseUrl).toString();
  } catch {
    return 'https://samaneyoga.ir';
  }
};

export async function notifyAdmins(url, preview = '') {
  const subscriptions = __getSubscriptionsForKey(ADMIN_PUSH_KEY);

  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    log.debug(
      {
        event: 'push_admin_skipped',
        reasonCode: 'SUBSCRIPTION_MISSING',
      },
      'Admin push notification skipped'
    );

    return {
      attempted: 0,
      delivered: 0,
      failed: 0,
    };
  }

  let webpush;

  try {
    webpush = getWebPushClient();
  } catch (error) {
    if (error instanceof PushConfigurationError) {
      log.warn(
        {
          event: 'push_admin_skipped',
          reasonCode: error.code,
        },
        'Admin push notification skipped because VAPID is unavailable'
      );

      return {
        attempted: subscriptions.length,
        delivered: 0,
        failed: subscriptions.length,
      };
    }

    throw error;
  }

  const plainPreview = stripHtml(preview);

  const shortPreview =
    plainPreview.slice(0, 140) || 'یک پیام جدید دریافت شده است.';

  const payload = JSON.stringify({
    title: 'پیام جدید برای پشتیبانی',
    body: shortPreview,
    url: normalizeUrl(url),
  });

  let delivered = 0;
  let failed = 0;

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload, {
          TTL: 60 * 60,
          urgency: 'normal',
        });

        delivered += 1;
      } catch (error) {
        failed += 1;

        const statusCode = Number(error?.statusCode || error?.status || 0);

        if ([404, 410].includes(statusCode)) {
          __removeSubscriptionForKey(ADMIN_PUSH_KEY, subscription.endpoint);

          return;
        }

        logError({
          log,
          error,

          message: 'Admin push notification delivery failed',

          data: {
            event: 'push_admin_delivery_failed',
            pushStatusCode: statusCode || null,
          },
        });
      }
    })
  );

  log.info(
    {
      event: 'push_admin_batch_completed',
      attempted: subscriptions.length,
      delivered,
      failed,
    },
    'Admin push notification batch completed'
  );

  return {
    attempted: subscriptions.length,
    delivered,
    failed,
  };
}
