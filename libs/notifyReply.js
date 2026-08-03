import 'server-only';

import {
  __getSubscriptionsForKey,
  __removeSubscriptionForKey,
  __userKey,
} from '@/app/api/push/subscribe/route';

import {
  getWebPushClient,
  PushConfigurationError,
} from '@/server/push/web-push-client';

import { createChildLogger, logError } from '@/server/logger';

const log = createChildLogger({
  component: 'notify-reply',
});

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

const normalizeRecipient = (to) => {
  return {
    userId:
      typeof to?.userId === 'string' && to.userId.trim()
        ? to.userId.trim()
        : null,

    anonymousId:
      typeof to?.anonymousId === 'string' && to.anonymousId.trim()
        ? to.anonymousId.trim()
        : null,
  };
};

export async function notifyReply(to, url, preview = '') {
  const { userId, anonymousId } = normalizeRecipient(to);

  const keys = [];

  if (userId) {
    keys.push(
      __userKey({
        userId,
      })
    );
  }

  if (anonymousId) {
    keys.push(
      __userKey({
        anonymousId,
      })
    );
  }

  if (keys.length === 0) {
    log.debug(
      {
        event: 'push_reply_skipped',
        reasonCode: 'RECIPIENT_MISSING',
      },
      'Reply push notification skipped'
    );

    return {
      attempted: 0,
      delivered: 0,
      failed: 0,
    };
  }

  const subscriptions = keys.flatMap((key) => __getSubscriptionsForKey(key));

  if (subscriptions.length === 0) {
    log.debug(
      {
        event: 'push_reply_skipped',
        reasonCode: 'SUBSCRIPTION_MISSING',
      },
      'Reply push notification skipped'
    );

    return {
      attempted: 0,
      delivered: 0,
      failed: 0,
    };
  }

  let webpush;

  try {
    /*
     * پیکربندی VAPID فقط هنگام اجرای واقعی تابع انجام می‌شود.
     * این خط هنگام Import و Build اجرا نمی‌شود.
     */
    webpush = getWebPushClient();
  } catch (error) {
    if (error instanceof PushConfigurationError) {
      log.warn(
        {
          event: 'push_reply_skipped',
          reasonCode: error.code,
        },
        'Reply push notification skipped because VAPID is unavailable'
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
    plainPreview.slice(0, 140) || 'برای مشاهده پاسخ کلیک کنید.';

  const payload = JSON.stringify({
    title: 'پاسخ جدید به سؤال شما',
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
          keys.forEach((key) => {
            __removeSubscriptionForKey(key, subscription.endpoint);
          });

          return;
        }

        logError({
          log,
          error,

          message: 'Reply push notification delivery failed',

          data: {
            event: 'push_reply_delivery_failed',
            pushStatusCode: statusCode || null,
          },
        });
      }
    })
  );

  log.info(
    {
      event: 'push_reply_batch_completed',
      attempted: subscriptions.length,
      delivered,
      failed,
    },
    'Reply push notification batch completed'
  );

  return {
    attempted: subscriptions.length,
    delivered,
    failed,
  };
}
